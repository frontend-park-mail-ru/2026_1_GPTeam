import { BasePage } from "../base_page.js";
import { BudgetForm } from "../../components/BudgetForm/budget_form.js";
import { Modal } from "../../components/Modal/modal.js";
import "./budget.css";

export class BudgetPage extends BasePage {
  async render(root) {
    root.innerHTML = `
      <div class="page">
        <main class="page__content">
          <div class="budget-page">
            <div class="budget-list" id="budget_list"></div>
            <div class="budget-form-wrapper" id="budget_form_wrapper"></div>
          </div>
        </main>
      </div>
    `;
    await this._loadBudgets(root);
    this._renderForm(root);
  }

  async _loadBudgets(root) {
    try {
      const response = await fetch("http://localhost:8080/get_budgets", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (data.code === 401) {
        window.location.href = "/login";
        return;
      }
      if (data.code === 200 && data.ids && data.ids.length > 0) {
        await this._loadBudgetCards(root, data.ids);
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
          const card = this._createBudgetCard(data.budget, id);
          list.appendChild(card);
        }
      } catch (err) {
        console.error("Ошибка загрузки бюджета", id, err);
      }
    }
  }

  _createBudgetCard(budget, id) {
    const percent = budget.target > 0
      ? Math.min(Math.round((budget.actual / budget.target) * 100), 100)
      : 0;

    const formatDate = (dateStr) => {
      if (!dateStr) return "—";
      return new Date(dateStr).toLocaleDateString("ru-RU", { 
        day: "numeric", 
        month: "short", 
        year: "numeric" 
      });
    };

    const currency = (budget.currency || "RUB").toUpperCase();

    const card = document.createElement("div");
    card.className = "budget-card";
    card.innerHTML = `
      <button class="budget-card__delete-btn" title="Удалить бюджет">×</button>
      <div class="budget-card__header">
        <div>
          <span class="budget-card__label">Фактический</span>
          <p class="budget-card__date">Дата начала: ${formatDate(budget.start_at)}</p>
        </div>
        <div style="text-align: right;">
          <span class="budget-card__label">Планируемый</span>
          <p class="budget-card__date">Дата окончания: ${formatDate(budget.end_at)}</p>
        </div>
      </div>
      <div class="budget-card__header">
        <span class="budget-card__amount">
          <span class="budget-card__currency">${currency} </span>${budget.actual.toLocaleString("ru-RU")}
        </span>
        <span class="budget-card__amount">
          <span class="budget-card__currency">${currency} </span>${budget.target.toLocaleString("ru-RU")}
        </span>
      </div>
      <div class="budget-card__header">
        <p class="budget-card__desc">${budget.title || "—"}</p>
        <p class="budget-card__desc">Запланированный лимит</p>
      </div>
      <div class="budget-card__progress-row">
        <span class="budget-card__progress-label">Использовано бюджета</span>
        <span class="budget-card__progress-percent">${percent}%</span>
      </div>
      <div class="budget-card__progress-bar">
        <div class="budget-card__progress-fill" style="width: ${percent}%"></div>
      </div>
    `;

    const deleteBtn = card.querySelector(".budget-card__delete-btn");
    deleteBtn.addEventListener("click", () => this._handleDelete(id, budget.title));

    return card;
  }

  _handleDelete(id, title) {
    const modal = new Modal({
      title: "Удалить бюджет?",
      message: `Вы точно хотите удалить бюджет "${title}"? Это действие нельзя отменить.`,
      cancelText: "Отмена",
      confirmText: "Удалить",
      onConfirm: () => this._deleteBudget(id),
      onCancel: () => modal.destroy(),
    });
    modal.render(document.body);
  }

  async _deleteBudget(id) {
    try {
      const response = await fetch(`http://localhost:8080/budget/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (data.code === 200) {
        window.location.href = "/budget";
      } else {
        console.error("Ошибка удаления:", data.message);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  _renderForm(root) {
    const form = new BudgetForm({});
    form.render(root.querySelector("#budget_form_wrapper"));
    form._on(form.getElement(), "submit", async (e) => form.submit(e));
    this._components.push(form);
  }
}