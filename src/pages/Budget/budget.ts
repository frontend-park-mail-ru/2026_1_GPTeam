import { BasePage } from "../base_page.ts";
import { BudgetForm } from "../../components/BudgetForm/budget_form.ts";
import { BudgetCard } from "../../components/BudgetCard/budget_card.ts";
import { Modal } from "../../components/Modal/modal.ts";
import { ModalForm } from "../../components/ModalForm/modal_form.ts";
import "./budget.scss";
import { router } from "../../router/router_instance.ts";
import { client } from "../../api/client.ts";
import { is_login } from "../../api/auth.ts";
import type {
    BudgetListResponse as BudgetListResponseType,
    BudgetGetResponse,
    DeleteResponse as DeleteResponseType,
    Budget,
} from "../../types/interfaces.ts";

/**
 * Страница управления бюджетами.
 * @class BudgetPage
 * @extends BasePage
 */
export class BudgetPage extends BasePage {
    /**
     * @param {HTMLElement} root
     */
    async render(root: HTMLElement): Promise<void> {
        const today = new Date().toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        root.innerHTML = `
            <div class="page">
                <main class="page__content">
                    <div class="budget">
                        <div class="budget__header">
                            <h2 class="budget__title js--inner-header">Бюджет</h2>
                            <p class="budget__page-date">${today}</p>
                        </div>
                        <div class="budget__list js--budget-list"></div>
                        <div class="budget__slot js--budget-slot"></div>
                    </div>
                </main>
            </div>
        `;
        await this._loadBudgets(root);
    }

    destroy(): void {
        super.destroy();
        document.querySelectorAll(".modal, .modal-form").forEach(el => el.remove());
    }

    /**
     * Загружает список бюджетов и рендерит карточки или форму создания.
     * @private
     */
    private async _loadBudgets(root: HTMLElement): Promise<void> {
        try {
            let response = await client("/api/get_budgets", { method: "GET", credentials: "include" });
            let data: BudgetListResponseType = await response.json();
            if (data.code === 401) {
                const login = await is_login();
                if (!login) { router.navigate("/login"); return; }
                response = await client("/api/get_budgets", { method: "GET", credentials: "include" });
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
     * Рендерит карточки бюджетов по списку ID.
     * @private
     */
    private async _loadBudgetCards(root: HTMLElement, ids: number[]): Promise<void> {
        const list = root.querySelector<HTMLElement>(".js--budget-list");
        if (!list) return;
        for (const id of ids) {
            try {
                const response = await client(`/api/get_budget/${id}`, { method: "GET", credentials: "include" });
                const data: BudgetGetResponse = await response.json();
                if (data.code === 200 && data.budget) {
                    const card = new BudgetCard({
                        budget: data.budget as Budget,
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
     * Рендерит инлайн форму создания бюджета.
     * @private
     */
    private _renderInlineForm(root: HTMLElement): void {
        const form = new BudgetForm({});
        form.render(root.querySelector<HTMLElement>(".js--budget-slot")!);
        this._components.push(form);
    }

    /**
     * Рендерит кнопку открытия модального окна создания бюджета.
     * @private
     */
    private _renderCreateButton(root: HTMLElement): void {
        const container = root.querySelector<HTMLElement>(".js--budget-slot");
        if (!container) return;
        container.innerHTML = `<button type="button" class="budget__create js--budget-create">+ Создать бюджет</button>`;
        container.querySelector<HTMLButtonElement>(".js--budget-create")?.addEventListener("click", () => {
            this._renderModalForm();
        });
    }

    /**
     * Показывает модальное окно подтверждения удаления бюджета.
     * @private
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
     * Удаляет бюджет через API.
     * @private
     */
    private async _deleteBudget(id: number, modal: Modal): Promise<void> {
        try {
            const response = await client(`/api/budget/${id}`, { method: "DELETE", credentials: "include" });
            const data: DeleteResponseType = await response.json();
            if (data.code === 200) {
                modal.destroy();
                router.refresh();
            } else
                modal.show_error(data.message ? data.message : "Ошибка сервера");
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }

    /**
     * Рендерит модальное окно с формой создания бюджета.
     * @private
     */
    private _renderModalForm(): void {
        const modal = new ModalForm({ onClose: () => modal.destroy() });
        modal.render(document.body);
        const form = new BudgetForm({});
        const container = modal.getFormContainer();
        if (container) form.render(container);
        this._components.push(form);
    }
}
