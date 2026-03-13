import { BasePage } from "../base_page.js";
import { BudgetForm } from "../../components/BudgetForm/budget_form.js";
import { BudgetCard } from "../../components/BudgetCard/budget_card.js";
import { Modal } from "../../components/Modal/modal.js";
import { ModalForm } from "../../components/ModalForm/modal_form.js";
import "./budget.css";
import { router } from "../../router/router_instance.js";
import { Header } from "../../components/Header/header.js";
import { client } from "../../api/client.js";
import {is_login} from "../../api/auth.js";

/**
 * Страница управления бюджетами.
 * Обеспечивает отображение списка активных бюджетов, их удаление через модальные окна
 * и создание новых (как в инлайн-режиме, так и в модальном окне).
 * * @class BudgetPage
 * @extends BasePage
 */
export class BudgetPage extends BasePage {
    /**
     * Основной метод рендеринга страницы.
     * Инициализирует общую структуру, хедер с подсветкой текущей страницы 
     * и запускает загрузку данных бюджетов.
     * * @async
     * @param {HTMLElement} root - Корневой элемент для отрисовки.
     * @returns {Promise<void>}
     */
    async render(root) {
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

        /** * Обработка хедера: 
         * Передаем cur_page: "/budget", чтобы компонент Header 
         * автоматически добавил класс 'active_header_link' нужной ссылке.
         */
        const header = new Header({
            cur_page: "/budget",
        });
        header.render(root.querySelector(".page__header"));
        this._components.push(header);

        await this._loadBudgets(root);
    }

    /**
     * Очистка страницы при переходе.
     * Вызывает базовую очистку и принудительно удаляет модальные оверлеи из body.
     */
    destroy() {
        super.destroy();
        document.querySelectorAll(".modal-overlay, .modal-form-overlay").forEach(el => el.remove());
    }

    /**
     * Загружает идентификаторы бюджетов.
     * Если бюджеты есть — рендерит их карточки, если нет — показывает пустую форму.
     * @private
     * @async
     */
    async _loadBudgets(root) {
        try {
            let response = await client("/get_budgets", {
                method: "GET",
                credentials: "include",
            });
            let data = await response.json();

            if (data.code === 401) {
                let login = await is_login();
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
     * @private
     * @async
     */
    async _loadBudgetCards(root, ids) {
        const list = root.querySelector("#budget_list");
        for (const id of ids) {
            try {
                const response = await client(`/get_budget/${id}`, {
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();
                if (data.code === 200) {
                    const card = new BudgetCard({
                        budget: data.budget,
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
     * @private
     */
    _renderInlineForm(root) {
        const form = new BudgetForm({});
        form.render(root.querySelector("#budget_content"));
        form._on(form.getElement(), "submit", async (e) => form.submit(e));
        this._components.push(form);
    }

    /**
     * Рендерит кнопку для открытия модального окна создания бюджета.
     * @private
     */
    _renderCreateButton(root) {
        const container = root.querySelector("#budget_content");
        container.innerHTML = `<button class="budget-create-btn" id="create_budget_btn">+ Создать бюджет</button>`;
        container.querySelector("#create_budget_btn").addEventListener("click", () => {
            this._renderModalForm();
        });
    }

    /**
     * Обрабатывает нажатие на кнопку удаления: вызывает модальное окно подтверждения.
     * Обрезает название бюджета до 50 символов для корректного отображения в модалке.
     * @private
     */
    _handleDelete(id, title) {
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
     * @private
     * @async
     */
    async _deleteBudget(id, modal) {
        try {
            const response = await client(`/budget/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await response.json();
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
     * @private
     */
    _renderModalForm() {
        const modal = new ModalForm({
            onClose: () => modal.destroy(),
        });
        modal.render(document.body);

        const form = new BudgetForm({});
        form.render(modal.getFormContainer());
        form._on(form.getElement(), "submit", async (e) => form.submit(e));
        this._components.push(form);
    }
}