import { BasePage } from "../base_page.js";
import { BudgetForm } from "../../components/BudgetForm/budget_form.js";
import { BudgetCard } from "../../components/BudgetCard/budget_card.js";
import { Modal } from "../../components/Modal/modal.js";
import { ModalForm } from "../../components/ModalForm/modal_form.js";
import "./budget.css";
import { router } from "../../router/router_instance.js";
import {Header} from "../../components/Header/header.js";

export class BudgetPage extends BasePage {
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

        const header = new Header({
            cur_page: "/budget",
        });
        header.render(root.querySelector(".page__header"));
        this._components.push(header);

        await this._loadBudgets(root);
    }

    destroy() {
        super.destroy();
        document.querySelectorAll(".modal-overlay, .modal-form-overlay").forEach(el => el.remove());
    }

    async _loadBudgets(root) {
        try {
            const response = await fetch("http://localhost:8080/get_budgets", {
                method: "GET",
                credentials: "include",
            });
            const data = await response.json();

            if (data.code === 401) {
                router.navigate("/login");
                return;
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

    async _loadBudgetCards(root, ids) {
        const list = root.querySelector("#budget_list");
        for (const id of ids) {
            try {
                const response = await fetch(`http://localhost:8080/get_budget/${id}`, {
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

    _renderInlineForm(root) {
        const form = new BudgetForm({});
        form.render(root.querySelector("#budget_content"));
        form._on(form.getElement(), "submit", async (e) => form.submit(e));
        this._components.push(form);
    }

    _renderCreateButton(root) {
        const container = root.querySelector("#budget_content");
        container.innerHTML = `<button class="budget-create-btn" id="create_budget_btn">+ Создать бюджет</button>`;
        container.querySelector("#create_budget_btn").addEventListener("click", () => {
            this._renderModalForm();
        });
    }

    _handleDelete(id, title) {
        const modal = new Modal({
            title: "Удалить бюджет?",
            message: `Вы точно хотите удалить бюджет "${title}"? Это действие нельзя отменить.`,
            cancelText: "Отмена",
            confirmText: "Удалить",
            onConfirm: () => this._deleteBudget(id, modal),
            onCancel: () => modal.destroy(),
        });
        modal.render(document.body);
    }

    async _deleteBudget(id, modal) {
        try {
            const response = await fetch(`http://localhost:8080/budget/${id}`, {
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