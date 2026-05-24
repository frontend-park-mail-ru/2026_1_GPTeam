import { BasePage } from "../base_page";
import { TransactionCard } from "../../components/TransactionCard/transaction_card";
import { fetchTransactionIds, fetchTransactionDetail, searchTransactions, getTransactionTitlesAutocomplete } from "../../api/transactions";
import { get_short_accounts } from "../../api/accounts";
import { Transaction, ShortAccount } from "../../types/interfaces";
import { CustomCalendar } from "../../components/CustomCalendar/custom_calendar";
import { CustomSelect } from "../../components/CustomSelect/custom_select";
import Handlebars from "handlebars";
import { router } from "../../router/router_instance";
// @ts-ignore
import template from "./operations.hbs?raw";
import "./operations.scss";
import {CsvImport} from "../../components/CsvImport/csv_import.ts";
import {CsvExport} from "../../components/CsvExport/csv_export.ts";

/**
 * Страница списка операций с фильтрацией по типу и периоду.
 * @class OperationsPage
 * @extends BasePage
 */
export class OperationsPage extends BasePage {
    private _allTransactions: Transaction[] = [];
    private _activeFilter: "all" | "income" | "expense" | "month" = "all";
    private _accounts: ShortAccount[] = [];
    private _categories: string[] = [];
    private _searchFilters: {
        start_date?: string;
        end_date?: string;
        category?: string;
        account_id?: number;
        q?: string;
    } = {};
    private _autocompleteDebounce: number | null = null;
    private _searchDebounce: number | null = null;
    private _startCal: CustomCalendar | null = null;
    private _endCal: CustomCalendar | null = null;
    private _categorySelect: CustomSelect | null = null;
    private _accountSelect: CustomSelect | null = null;

    async render(root: HTMLElement): Promise<void> {
        const compiledTemplate = Handlebars.compile(template);
        root.innerHTML = `
            <div class="page">
                <main class="page__content">${compiledTemplate({}).trim()}</main>
            </div>
        `;

        const addBtn = root.querySelector<HTMLButtonElement>(".operations-page__add-btn");
        if (addBtn) addBtn.onclick = () => router.navigate("/operations/create");

        this._initFilters(root);
        this._initSearch(root);
        await this._loadAccountsAndCategories(root);
        await this._loadTransactions(root);

        const export_component = new CsvExport({});
        const export_container = root.querySelector("#export");
        if (export_container) {
            export_component.render(export_container);
        }

        let import_component: CsvImport = new CsvImport({});
        let container: HTMLElement | null = root.querySelector("#import");
        if (!container) {
            return;
        }
        import_component.render(container);
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
     * Инициализирует поиск и автокомплит.
     * @private
     * @param {HTMLElement} root
     */
    private _initSearch(root: HTMLElement): void {
        const searchInput = root.querySelector<HTMLInputElement>("#search_input");
        const autocomplete = root.querySelector<HTMLElement>("#search_autocomplete");
        const startDateDisplay = root.querySelector<HTMLInputElement>("#search_start_date_display");
        const startDateInput = root.querySelector<HTMLInputElement>("#search_start_date_input");
        const startDateBtn = root.querySelector<HTMLElement>("#search_start_date_calendar_btn");
        const startDatePopup = root.querySelector<HTMLElement>("#search_start_date_calendar");
        const endDateDisplay = root.querySelector<HTMLInputElement>("#search_end_date_display");
        const endDateInput = root.querySelector<HTMLInputElement>("#search_end_date_input");
        const endDateBtn = root.querySelector<HTMLElement>("#search_end_date_calendar_btn");
        const endDatePopup = root.querySelector<HTMLElement>("#search_end_date_calendar");
        const categoryDisplay = root.querySelector<HTMLElement>("#search_category_display");
        const categoryInput = root.querySelector<HTMLInputElement>("#search_category_input");
        const categoryDropdown = root.querySelector<HTMLElement>("#search_category_dropdown");
        const accountDisplay = root.querySelector<HTMLElement>("#search_account_display");
        const accountInput = root.querySelector<HTMLInputElement>("#search_account_input");
        const accountDropdown = root.querySelector<HTMLElement>("#search_account_dropdown");
        const resetBtn = root.querySelector<HTMLButtonElement>("#search_reset");

        if (!searchInput || !autocomplete || !startDateDisplay || !startDateInput || !startDateBtn || !startDatePopup ||
            !endDateDisplay || !endDateInput || !endDateBtn || !endDatePopup || !categoryDisplay || !categoryInput || !categoryDropdown ||
            !accountDisplay || !accountInput || !accountDropdown || !resetBtn) {
            return;
        }

        // Инициализация календарей
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        this._startCal = new CustomCalendar(startDatePopup, startDateDisplay, startDateInput, null, (date) => {
            if (date) {
                this._searchFilters.start_date = date.toISOString().split('T')[0];
                this._performSearch(root);
            } else {
                delete this._searchFilters.start_date;
                this._performSearch(root);
            }
        });

        this._endCal = new CustomCalendar(endDatePopup, endDateDisplay, endDateInput, null, (date) => {
            if (date) {
                this._searchFilters.end_date = date.toISOString().split('T')[0];
                this._performSearch(root);
            } else {
                delete this._searchFilters.end_date;
                this._performSearch(root);
            }
        });

        const toggleStart = (e: Event) => {
            e.stopPropagation();
            this._endCal?.close();
            this._categorySelect?.close();
            this._accountSelect?.close();
            this._startCal?.toggle();
        };
        startDateBtn.addEventListener("click", toggleStart);
        startDateDisplay.addEventListener("click", toggleStart);

        const toggleEnd = (e: Event) => {
            e.stopPropagation();
            this._startCal?.close();
            this._categorySelect?.close();
            this._accountSelect?.close();
            this._endCal?.toggle();
        };
        endDateBtn.addEventListener("click", toggleEnd);
        endDateDisplay.addEventListener("click", toggleEnd);

        // Закрытие календарей и селектов при клике вне
        document.addEventListener("click", () => {
            this._startCal?.close();
            this._endCal?.close();
            this._categorySelect?.close();
            this._accountSelect?.close();
        });

        // Live search с debounce
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.trim();

            // Очистка предыдущих таймеров
            if (this._autocompleteDebounce) {
                window.clearTimeout(this._autocompleteDebounce);
            }
            if (this._searchDebounce) {
                window.clearTimeout(this._searchDebounce);
            }

            // Автокомплит
            if (query.length < 2) {
                autocomplete.classList.remove("operations-search__autocomplete--visible");
                autocomplete.innerHTML = "";
            } else {
                this._autocompleteDebounce = window.setTimeout(async () => {
                    const titles = await getTransactionTitlesAutocomplete(query);
                    autocomplete.innerHTML = "";

                    if (titles.length === 0) {
                        const emptyItem = document.createElement("div");
                        emptyItem.className = "operations-search__autocomplete-item operations-search__autocomplete-item--empty";
                        emptyItem.textContent = "Ничего не найдено";
                        autocomplete.appendChild(emptyItem);
                    } else {
                        titles.forEach(title => {
                            const item = document.createElement("div");
                            item.className = "operations-search__autocomplete-item";
                            item.textContent = title;
                            item.addEventListener("click", () => {
                                searchInput.value = title;
                                this._searchFilters.q = title;
                                autocomplete.classList.remove("operations-search__autocomplete--visible");
                                this._performSearch(root);
                            });
                            autocomplete.appendChild(item);
                        });
                    }

                    autocomplete.classList.add("operations-search__autocomplete--visible");
                }, 300);
            }

            // Live search с debounce 500ms
            this._searchDebounce = window.setTimeout(() => {
                this._searchFilters.q = query;
                this._performSearch(root);
            }, 500);
        });

        // Скрытие автокомплита при клике вне
        document.addEventListener("click", (e) => {
            if (!searchInput.contains(e.target as Node) && !autocomplete.contains(e.target as Node)) {
                autocomplete.classList.remove("operations-search__autocomplete--visible");
            }
        });

        // Поиск при нажатии Enter (мгновенный поиск без ожидания debounce)
        searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                if (this._searchDebounce) {
                    window.clearTimeout(this._searchDebounce);
                }
                this._searchFilters.q = searchInput.value.trim();
                autocomplete.classList.remove("operations-search__autocomplete--visible");
                this._performSearch(root);
            }
        });

        // Сброс фильтров
        resetBtn.addEventListener("click", () => {
            this._searchFilters = {};
            searchInput.value = "";
            this._startCal?.clearSelection();
            this._endCal?.clearSelection();
            this._categorySelect?.reset();
            this._accountSelect?.reset();
            this._loadTransactions(root);
        });
    }

    /**
     * Выполняет поиск транзакций.
     * @private
     * @param {HTMLElement} root
     */
    private async _performSearch(root: HTMLElement): Promise<void> {
        const listContainer = root.querySelector<HTMLElement>("#transactions_list")!;
        listContainer.innerHTML = "<div class='empty-state'>Поиск...</div>";

        try {
            const transactions = await searchTransactions(this._searchFilters);
            this._allTransactions = transactions;
            this._renderFiltered(root);
        } catch {
            listContainer.innerHTML = "<div class='error-state'>Ошибка поиска</div>";
        }
    }

    /**
     * Загружает аккаунты и категории для фильтров.
     * @private
     * @param {HTMLElement} root
     */
    private async _loadAccountsAndCategories(root: HTMLElement): Promise<void> {
        const categoryDisplay = root.querySelector<HTMLElement>("#search_category_display");
        const categoryInput = root.querySelector<HTMLInputElement>("#search_category_input");
        const categoryDropdown = root.querySelector<HTMLElement>("#search_category_dropdown");
        const accountDisplay = root.querySelector<HTMLElement>("#search_account_display");
        const accountInput = root.querySelector<HTMLInputElement>("#search_account_input");
        const accountDropdown = root.querySelector<HTMLElement>("#search_account_dropdown");

        try {
            const accountsResponse = await get_short_accounts();
            if (accountsResponse && accountsResponse.accounts && accountDisplay && accountInput && accountDropdown) {
                this._accounts = accountsResponse.accounts;
                accountDropdown.innerHTML = `<div class="custom-select__option" data-value="">Все счета</div>` +
                    this._accounts.map(account => `<div class="custom-select__option" data-value="${account.id}">${account.name}</div>`).join("");
                this._accountSelect = new CustomSelect(accountDisplay, accountInput, accountDropdown, (value) => {
                    this._searchFilters.account_id = value ? parseInt(value, 10) : undefined;
                    this._performSearch(root);
                });
            }
        } catch {
            console.error("Failed to load accounts");
        }

        // Загрузка категорий из существующих транзакций
        try {
            const ids = await fetchTransactionIds();
            if (ids && ids.length > 0 && categoryDisplay && categoryInput && categoryDropdown) {
                const results = await Promise.all(ids.slice(0, 50).map(id => fetchTransactionDetail(id)));
                const transactions = results.filter((t): t is Transaction => t !== null);
                const categories = new Set<string>();
                transactions.forEach(t => {
                    if (t.category) {
                        categories.add(t.category);
                    }
                });
                this._categories = Array.from(categories).sort();

                categoryDropdown.innerHTML = `<div class="custom-select__option" data-value="">Все категории</div>` +
                    this._categories.map(category => `<div class="custom-select__option" data-value="${category}">${category}</div>`).join("");
                this._categorySelect = new CustomSelect(categoryDisplay, categoryInput, categoryDropdown, (value) => {
                    this._searchFilters.category = value || undefined;
                    this._performSearch(root);
                });
            }
        } catch {
            console.error("Failed to load categories");
        }
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

        // Сортировка по дате транзакции (сверху вниз - от новых к старым)
        filtered.sort((a, b) => {
            const dateA = new Date(a.transaction_date);
            const dateB = new Date(b.transaction_date);
            return dateB.getTime() - dateA.getTime();
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
