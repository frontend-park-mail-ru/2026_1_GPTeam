import { BasePage } from "../base_page";
import { Header } from "../../components/Header/header";
import { TransactionCard } from "../../components/TransactionCard/transaction_card";
import { fetchTransactionIds, fetchTransactionDetail } from "../../api/transactions";
import { Transaction } from "../../types/interfaces";
import Handlebars from "handlebars";
import { router } from "../../router/router_instance";
// @ts-ignore
import template from "./operations.hbs?raw";
import "./operations.css";

/**
 * Страница списка операций с фильтрацией по типу и периоду.
 * @class OperationsPage
 * @extends BasePage
 */
export class OperationsPage extends BasePage {
    private _allTransactions: Transaction[] = [];
    private _activeFilter: "all" | "income" | "expense" | "month" = "all";

    async render(root: HTMLElement): Promise<void> {
        const compiledTemplate = Handlebars.compile(template);
        root.innerHTML = `
            <div class="page">
                <header class="page__header"></header>
                <main class="page__content">${compiledTemplate({}).trim()}</main>
            </div>
        `;

        const header = new Header({ cur_page: "/operations" });
        header.render(root.querySelector(".page__header") as HTMLElement);
        this._components.push(header);

        const addBtn = root.querySelector<HTMLButtonElement>(".operations-page__add-btn");
        if (addBtn) addBtn.onclick = () => router.navigate("/operations/create");

        this._initFilters(root);
        await this._loadTransactions(root);
    }

    /**
     * Навешивает обработчики на кнопки фильтров.
     * @private
     * @param {HTMLElement} root
     */
    private _initFilters(root: HTMLElement): void {
        root.querySelectorAll<HTMLButtonElement>(".operations-page__filter").forEach(btn => {
            btn.addEventListener("click", () => {
                root.querySelectorAll(".operations-page__filter").forEach(b => b.classList.remove("operations-page__filter--active"));
                btn.classList.add("operations-page__filter--active");

                const text = btn.textContent?.trim();
                if (text === "Все") this._activeFilter = "all";
                else if (text === "Доходы") this._activeFilter = "income";
                else if (text === "Расходы") this._activeFilter = "expense";
                else if (text === "За месяц") this._activeFilter = "month";

                this._renderFiltered(root);
            });
        });
    }

    /**
     * Загружает все транзакции с сервера.
     * @private
     * @param {HTMLElement} root
     */
    private async _loadTransactions(root: HTMLElement): Promise<void> {
        const listContainer = root.querySelector<HTMLElement>("#transactions_list")!;

        try {
            const ids = await fetchTransactionIds();
            if (!ids || ids.length === 0) {
                listContainer.innerHTML = "<div class='empty-state'>Операций пока нет</div>";
                this._updateKpi(root, []);
                return;
            }

            const results = await Promise.all(ids.map(id => fetchTransactionDetail(id)));
            this._allTransactions = results.filter((t): t is Transaction => t !== null);

            this._renderFiltered(root);
        } catch {
            listContainer.innerHTML = "<div class='error-state'>Ошибка загрузки операций</div>";
        }
    }

    /**
     * Фильтрует транзакции и перерисовывает список и KPI.
     * @private
     * @param {HTMLElement} root
     */
    private _renderFiltered(root: HTMLElement): void {
        const listContainer = root.querySelector<HTMLElement>("#transactions_list")!;
        const now = new Date();

        const filtered = this._allTransactions.filter(t => {
            if (this._activeFilter === "income") return t.type.toUpperCase() === "INCOME";
            if (this._activeFilter === "expense") return t.type.toUpperCase() === "EXPENSE";
            if (this._activeFilter === "month") {
                const d = new Date(t.transaction_date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }
            return true;
        });

        listContainer.innerHTML = "";
        this._components = this._components.filter(c => !(c instanceof TransactionCard));

        if (filtered.length === 0) {
            listContainer.innerHTML = "<div class='empty-state'>Нет операций</div>";
        } else {
            filtered.forEach(data => {
                const card = new TransactionCard(data, (deletedId) => {
                    this._allTransactions = this._allTransactions.filter(t => t.id !== deletedId);
                    this._renderFiltered(root);
                });
                card.render(listContainer);
                this._components.push(card);
            });
        }

        this._updateKpi(root, filtered);
    }

    /**
     * Форматирует сумму для KPI — сокращает большие числа.
     * @private
     * @param {number} value
     * @returns {string}
     */
    private _formatKpiAmount(value: number): string {
        if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + " млрд";
        if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + " млн";
        if (value >= 1_000) return (value / 1_000).toFixed(1) + " тыс";
        return value.toLocaleString("ru-RU", { minimumFractionDigits: 2 });
    }

    /**
     * Обновляет блок KPI (количество, доходы, расходы).
     * @private
     * @param {HTMLElement} root
     * @param {Transaction[]} transactions
     */
    private _updateKpi(root: HTMLElement, transactions: Transaction[]): void {
        const total = root.querySelector<HTMLElement>(".operations-kpi:nth-child(1) .operations-kpi__value");
        const income = root.querySelector<HTMLElement>(".operations-kpi:nth-child(2) .operations-kpi__value");
        const expense = root.querySelector<HTMLElement>(".operations-kpi:nth-child(3) .operations-kpi__value");

        if (total) total.textContent = String(transactions.length);

        const totalIncome = transactions
            .filter(t => t.type.toUpperCase() === "INCOME")
            .reduce((sum, t) => sum + t.value, 0);

        const totalExpense = transactions
            .filter(t => t.type.toUpperCase() === "EXPENSE")
            .reduce((sum, t) => sum + t.value, 0);

        if (income) income.textContent = `RUB ${this._formatKpiAmount(totalIncome)}`;
        if (expense) expense.textContent = `RUB ${this._formatKpiAmount(totalExpense)}`;
    }
}