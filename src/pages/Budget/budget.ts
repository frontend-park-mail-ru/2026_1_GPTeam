import { BasePage } from "../base_page.js";
import { BudgetForm } from "../../components/BudgetForm/budget_form.js";
import { BudgetCard } from "../../components/BudgetCard/budget_card.js";
import { Modal } from "../../components/Modal/modal.js";
import { ModalForm } from "../../components/ModalForm/modal_form.js";
import "./budget.css";
import { router } from "../../router/router_instance.js";
import { Header } from "../../components/Header/header.js";
import { client } from "../../api/client.js";
import { is_login } from "../../api/auth.js";

/**
 * Ответ сервера со списком ID бюджетов.
 */
interface BudgetListResponse {
    code: number;
    ids?: number[];
}

/**
 * Ответ сервера с данными одного бюджета.
 */
interface BudgetItemResponse {
    code: number;
    budget?: Record<string, unknown>;
    message?: string;
}

/**
 * Ответ сервера на удаление бюджета.
 */
interface DeleteResponse {
    code: number;
    message?: string;
}

/**
 * Страница управления бюджетами.
 * Обеспечивает отображение списка активных бюджетов, их удаление через модальные окна
 * и создание новых (как в инлайн-режиме, так и в модальном окне).
 *
 * @class BudgetPage
 * @extends BasePage
 */
export class BudgetPage extends BasePage {
    /**
     * Основной метод рендеринга страницы.
     * Инициализирует общую структуру, хедер с подсветкой текущей страницы
     * и запускает загрузку данных бюджетов.
     *
     * @async
     * @param {HTMLElement} root - Корневой элемент для отрисовки.
     * @returns {Promise<void>}
     */
    async render(root: HTMLElement): Promise<void> {
        root.innerHTML = `
            <div class="page">
                <header class="page__header"></header>
                <main class="page__content">
                    <div class="budget-page">
                        <div class="budget-list" id="budget_list"></div>
                        <div id="budget_content"></div>
                    </div>
                </main>
            </div>
        `;

        const header = new Header({ cur_page: "/budget" });
        header.render(root.querySelector<HTMLElement>(".page__header")!);
        this._components.push(header);

        await this._loadBudgets(root);
    }

    /**
     * Очистка страницы при переходе.
     * Вызывает базовую очистку и принудительно удаляет модальные оверлеи из body.
     *
     * @returns {void}
     */
    destroy(): void {
        super.destroy();
        document.querySelectorAll(".modal-overlay, .modal-form-overlay").forEach(el => el.remove());
    }

    /**
     * Загружает идентификаторы бюджетов.
     * Если бюджеты есть — рендерит их карточки, если нет — показывает пустую форму.
     *
     * @private
     * @async
     * @returns {Promise<void>}
     */
    private async _loadBudgets(root: HTMLElement): Promise<void> {
        try {
            let response = await client("/get_budgets", {
                method: "GET",
                credentials: "include",
            });
            let data: BudgetListResponse = await response.json();

            if (data.code === 401) {
                const login = await is_login();
                if (!login) {
                    router.navigate("/login");
                    return;
                }
                response = await client("/get_budgets", {
                    method: "GET",
                    credentials: "include",
                });
                data = await response.json();
            }

            if (data.code === 200 && data.ids && data.ids.length > 0) {
                await this._loadBudgetCards(root, data.ids);
                this._renderCreateButton(root);
            } else {
                this._renderInlineForm(root);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }

    /**
     * Рендерит карточки бюджетов на основе полученных ID.
     *
     * @private
     * @async
     * @param {HTMLElement} root - Корневой элемент страницы.
     * @param {number[]} ids - Список ID бюджетов.
     * @returns {Promise<void>}
     */
    private async _loadBudgetCards(root: HTMLElement, ids: number[]): Promise<void> {
        const list = root.querySelector<HTMLElement>("#budget_list");
        if (!list) return;

        for (const id of ids) {
            try {
                const response = await client(`/get_budget/${id}`, {
                    method: "GET",
                    credentials: "include",
                });
                const data: BudgetItemResponse = await response.json();
                if (data.code === 200 && data.budget) {
                    const card = new BudgetCard({
                        budget: data.budget as never,
                        id,
                        onDelete: (id, title) => this._handleDelete(id, title),
                    });
                    card.render(list);
                    this._components.push(card);
                }
            } catch (err) {
                console.error("Ошибка загрузки бюджета", id, err);
            }
        }
    }

    /**
     * Рендерит форму создания бюджета прямо в основной контент.
     *
     * @private
     * @param {HTMLElement} root - Корневой элемент страницы.
     * @returns {void}
     */
    private _renderInlineForm(root: HTMLElement): void {
        const form = new BudgetForm({});
        form.render(root.querySelector<HTMLElement>("#budget_content")!);
        form.on(form.getElement()!, "submit", async (e) => form.submit(e));
        this._components.push(form);
    }

    /**
     * Рендерит кнопку для открытия модального окна создания бюджета.
     *
     * @private
     * @param {HTMLElement} root - Корневой элемент страницы.
     * @returns {void}
     */
    private _renderCreateButton(root: HTMLElement): void {
        const container = root.querySelector<HTMLElement>("#budget_content");
        if (!container) return;
        container.innerHTML = `<button class="budget-create-btn" id="create_budget_btn">+ Создать бюджет</button>`;
        container.querySelector<HTMLButtonElement>("#create_budget_btn")?.addEventListener("click", () => {
            this._renderModalForm();
        });
    }

    /**
     * Обрабатывает нажатие на кнопку удаления: вызывает модальное окно подтверждения.
     * Обрезает название бюджета до 50 символов для корректного отображения в модалке.
     *
     * @private
     * @param {number} id - ID бюджета.
     * @param {string} title - Название бюджета.
     * @returns {void}
     */
    private _handleDelete(id: number, title: string): void {
        const shortTitle = title.length > 50 ? title.slice(0, 50) + "..." : title;
        const modal = new Modal({
            title: "Удалить бюджет?",
            message: `Вы точно хотите удалить бюджет "${shortTitle}"? Это действие нельзя отменить.`,
            cancelText: "Отмена",
            confirmText: "Удалить",
            onConfirm: () => this._deleteBudget(id, modal),
            onCancel: () => modal.destroy(),
        });
        modal.render(document.body);
    }

    /**
     * Удаляет бюджет через API и обновляет страницу.
     *
     * @private
     * @async
     * @param {number} id - ID бюджета для удаления.
     * @param {Modal} modal - Экземпляр модального окна для закрытия после удаления.
     * @returns {Promise<void>}
     */
    private async _deleteBudget(id: number, modal: Modal): Promise<void> {
        try {
            const response = await client(`/budget/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data: DeleteResponse = await response.json();
            if (data.code === 200) {
                modal.destroy();
                router.refresh();
            } else {
                console.error("Ошибка удаления:", data.message);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }

    /**
     * Отрисовывает модальное окно с формой создания бюджета.
     *
     * @private
     * @returns {void}
     */
    private _renderModalForm(): void {
        const modal = new ModalForm({
            onClose: () => modal.destroy(),
        });
        modal.render(document.body);

        const form = new BudgetForm({});
        const container = modal.getFormContainer();
        if (container) form.render(container);
        form.on(form.getElement()!, "submit", async (e) => form.submit(e));
        this._components.push(form);
    }
}