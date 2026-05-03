import { BasePage } from "../base_page.ts";
import template from "./balance.hbs?raw";
import { get_balance } from "../../api/balance.ts";
import {
    createAccount,
    deleteAccount,
    fetchAccount,
    fetchAccounts,
    updateAccount,
} from "../../api/accounts.ts";
import { TotalBalance } from "../../components/TotalBalance/total_balance.ts";
import { IncomeBalance } from "../../components/IncomeBalance/income_balance.ts";
import { ExpensesBalance } from "../../components/ExpensesBalance/expenses_balance.ts";
import { Modal } from "../../components/Modal/modal.ts";
import { router } from "../../router/router_instance.ts";
import Handlebars from "handlebars";
import type {
    Account,
    AccountCreateRequest,
    AccountUpdateRequest,
    BalanceResponse as BalanceResponseType,
    CurrencyBalance,
} from "../../types/interfaces.ts";
import "./balance.scss";

const SUMMARY_CURRENCIES = ["RUB", "EUR", "USD"] as const;

/**
 * Страница баланса: сводка по валютам + CRUD счетов.
 */
export class BalancePage extends BasePage {
    private _accounts: Account[] = [];
    private _balances: CurrencyBalance[] = [];
    private _editingAccountId: number | null = null;
    private _selectedCurrency = "all";
    private _accountStatusTimer: number | null = null;

    async render(root: HTMLElement): Promise<void> {
        const balanceData = await this._loadBalance();
        if (balanceData.code === 401) {
            router.navigate("/login");
            return;
        }

        const compiledTemplate = Handlebars.compile(template);
        root.innerHTML = `
            <div class="page">
                <main class="page__content page__content--balance">${compiledTemplate({ date: balanceData.date }).trim()}</main>
            </div>
        `;

        if (balanceData.loadError) {
            this._showBalanceError(root, "Нет связи с сервером");
        }
        if (balanceData.balances)
            this._balances = this._normalizeBalances(balanceData.balances);
        this._initAccountControls(root);
        await this._loadAccounts(root);
        this._syncCurrencyFilters(root);
        this._renderBalanceSections(root, this._getBalancesForAvailableCurrencies());
        this._initFilters(root);
        this._applyCurrencyFilter(root);
    }

    private async _loadBalance(): Promise<BalanceResponseType & { loadError: boolean }> {
        try {
            const response = await get_balance() as BalanceResponseType;
            return { ...response, loadError: false };
        } catch {
            return {
                code: 200,
                message: "Backend недоступен",
                balances: [],
                date: this._currentMonthLabel(),
                loadError: true,
            };
        }
    }

    private _renderBalanceSections(root: HTMLElement, balances: CurrencyBalance[]): void {
        const balanceContent = root.querySelector<HTMLElement>(".js--balance-currencies");
        if (!balanceContent) return;

        balanceContent.innerHTML = "";

        if (balances.length === 0) {
            balanceContent.innerHTML = `
                <div class="balance-empty">
                    Баланс появится после добавления счёта.
                </div>
            `;
            return;
        }

        balances.forEach((item) => {
            const section = document.createElement("div");
            section.className = "balance__currency-section js--balance-currency-section";
            section.setAttribute("data-currency", item.currency);

            section.innerHTML = `
                <h3 class="balance__currency-label">${this._escape(item.currency)}</h3>
                <div class="balance__total-row"></div>
                <div class="balance__metrics-row"></div>
            `;
            balanceContent.appendChild(section);

            const total = new TotalBalance({
                balance: item.balance,
                currency: item.currency,
            });
            total.render(section.querySelector<HTMLElement>(".balance__total-row")!);
            this._components.push(total);

            const income = new IncomeBalance({
                amount: item.income,
                currency: item.currency,
            });
            income.render(section.querySelector<HTMLElement>(".balance__metrics-row")!);
            this._components.push(income);

            const expenses = new ExpensesBalance({
                amount: item.expenses,
                currency: item.currency,
            });
            expenses.render(section.querySelector<HTMLElement>(".balance__metrics-row")!);
            this._components.push(expenses);
        });
    }


    private _normalizeBalances(balances: CurrencyBalance[]): CurrencyBalance[] {
        const result = new Map<string, CurrencyBalance>();

        balances.forEach((item) => {
            const currency = String(item.currency ?? "").toUpperCase();
            if (!currency) return;

            if (!result.has(currency)) {
                result.set(currency, {
                    currency,
                    balance: 0,
                    income: 0,
                    expenses: 0,
                });
            }

            const summary = result.get(currency)!;
            summary.balance += this._toMoneyNumber(item.balance);
            summary.income += this._toMoneyNumber(item.income);
            summary.expenses += this._toMoneyNumber(item.expenses);
        });

        return this._sortCurrencies([...result.values()]);
    }

    private _getBalancesForAvailableCurrencies(): CurrencyBalance[] {
        const balancesByCurrency = new Map(this._balances.map((item) => [item.currency.toUpperCase(), item]));

        return this._getAvailableCurrencies().map((currency) => balancesByCurrency.get(currency) ?? {
            currency,
            balance: 0,
            income: 0,
            expenses: 0,
        });
    }

    private _getAvailableCurrencies(): string[] {
        const currencies = new Set<string>();

        this._accounts.forEach((account) => {
            const currency = String(account.currency ?? "").toUpperCase();
            if (currency) currencies.add(currency);
        });

        return this._sortCurrencyCodes([...currencies]);
    }

    private _sortCurrencies(balances: CurrencyBalance[]): CurrencyBalance[] {
        const byCurrency = new Map(balances.map((item) => [item.currency.toUpperCase(), item]));

        return this._sortCurrencyCodes([...byCurrency.keys()]).map((currency) => byCurrency.get(currency)!);
    }

    private _sortCurrencyCodes(currencies: string[]): string[] {
        const priority = new Map<string, number>(SUMMARY_CURRENCIES.map((currency, index) => [currency, index]));

        return currencies.sort((a, b) => {
            const priorityA = priority.get(a) ?? Number.MAX_SAFE_INTEGER;
            const priorityB = priority.get(b) ?? Number.MAX_SAFE_INTEGER;

            return priorityA === priorityB ? a.localeCompare(b) : priorityA - priorityB;
        });
    }

    private _toMoneyNumber(value: unknown): number {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : 0;
    }

    private _initFilters(root: HTMLElement): void {
        const filterButtons = root.querySelectorAll<HTMLButtonElement>(".js--balance-filter");

        filterButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                if (btn.hidden) return;

                this._selectedCurrency = btn.getAttribute("data-currency") ?? "all";
                this._applyCurrencyFilter(root);
                this._renderAccounts(root);
            });
        });
    }

    private _syncCurrencyFilters(root: HTMLElement): void {
        const availableCurrencies = new Set(this._getAvailableCurrencies());
        const filterButtons = root.querySelectorAll<HTMLButtonElement>(".js--balance-filter");

        filterButtons.forEach((button) => {
            const currency = button.getAttribute("data-currency") ?? "all";
            button.hidden = currency !== "all" && !availableCurrencies.has(currency);
        });

        if (this._selectedCurrency !== "all" && !availableCurrencies.has(this._selectedCurrency)) {
            this._selectedCurrency = "all";
        }
    }

    private _applyCurrencyFilter(root: HTMLElement): void {
        const sections = root.querySelectorAll<HTMLElement>(".js--balance-currency-section");
        const filterButtons = root.querySelectorAll<HTMLButtonElement>(".js--balance-filter");

        filterButtons.forEach((button) => {
            const currency = button.getAttribute("data-currency") ?? "all";
            button.classList.toggle("balance__filter--active", currency === this._selectedCurrency);
        });

        sections.forEach((section) => {
            const currency = section.getAttribute("data-currency");
            section.hidden = !(this._selectedCurrency === "all" || currency === this._selectedCurrency);
        });
    }

    private _initAccountControls(root: HTMLElement): void {
        root.querySelectorAll<HTMLButtonElement>(".js--account-open").forEach((button) => {
            button.addEventListener("click", () => this._openAccountForm(root));
        });

        root.querySelector<HTMLButtonElement>(".js--account-cancel")?.addEventListener("click", () => {
            this._closeAccountForm(root);
        });

        root.querySelector<HTMLFormElement>(".js--account-form")?.addEventListener("submit", (event) => {
            this._handleAccountSubmit(event, root);
        });

        root.querySelector<HTMLElement>(".js--accounts-list")?.addEventListener("click", (event) => {
            const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-account-action]");
            if (!target) return;

            const id = Number(target.dataset.accountId);
            if (!Number.isInteger(id)) return;

            if (target.dataset.accountAction === "edit") {
                this._openAccountForm(root, id);
            }
            if (target.dataset.accountAction === "delete") {
                this._deleteAccount(root, id);
            }
            if (target.dataset.accountAction === "read") {
                this._showAccountDetails(root, id);
            }
        });
    }

    private async _loadAccounts(root: HTMLElement): Promise<void> {
        const list = root.querySelector<HTMLElement>(".js--accounts-list");
        if (!list) return;

        list.innerHTML = "<div class='account-card account-card--loading'>Загрузка счетов...</div>";
        try {
            const data = await fetchAccounts();
            if (data.code === 401) {
                router.navigate("/login");
                return;
            }
            if (data.code !== 200) {
                this._setAccountStatus(root, data.message ?? "Не удалось загрузить счета", "error");
                list.innerHTML = "<div class='account-card account-card--empty'>Счета не загружены</div>";
                return;
            }

            this._accounts = data.accounts ?? [];
            this._renderAccounts(root);
        } catch {
            this._accounts = [];
            list.innerHTML = "<div class='account-card account-card--empty'>Нет связи с backend на 8081</div>";
            this._setAccountStatus(root, "Проверь, что backend запущен и VITE_SERVER_URL указывает на http://localhost:8081", "error");
        }
    }

    private _renderAccounts(root: HTMLElement): void {
        const list = root.querySelector<HTMLElement>(".js--accounts-list");
        if (!list) return;

        const accounts = this._getVisibleAccounts();

        if (accounts.length === 0) {
            const isCurrencyFilterActive = this._selectedCurrency !== "all";
            list.innerHTML = `
                <article class="account-card account-card--empty">
                    <span class="account-card__label">${isCurrencyFilterActive ? this._escape(this._selectedCurrency) : "Пусто"}</span>
                    <h4 class="account-card__name">${isCurrencyFilterActive ? "Нет счетов в этой валюте" : "Счетов пока нет"}</h4>
                    <p class="account-card__meta">${isCurrencyFilterActive ? "Выбери другую валюту или добавь новый счёт." : "Нажми «Новый счёт», чтобы добавить первый источник денег."}</p>
                </article>
            `;
            return;
        }

        list.innerHTML = accounts.map((account) => `
            <article class="account-card">
                <div class="account-card__topline">
                    <span class="account-card__label">${this._escape(account.currency)}</span>
                    <button class="account-card__ghost" type="button" data-account-action="read" data-account-id="${account.id}">Открыть</button>
                </div>
                <h4 class="account-card__name">${this._escape(account.name)}</h4>
                <div class="account-card__balance">${this._formatMoney(account.balance, account.currency)}</div>
                <p class="account-card__meta">Обновлён: ${this._formatDate(account.updated_at)}</p>
                <div class="account-card__actions">
                    <button type="button" data-account-action="edit" data-account-id="${account.id}">Изменить</button>
                    <button type="button" data-account-action="delete" data-account-id="${account.id}">Удалить</button>
                </div>
            </article>
        `).join("");
    }

    private _getVisibleAccounts(): Account[] {
        if (this._selectedCurrency === "all") {
            return this._accounts;
        }

        return this._accounts.filter((account) => account.currency.toUpperCase() === this._selectedCurrency);
    }

    private _openAccountForm(root: HTMLElement, accountId?: number): void {
        const form = root.querySelector<HTMLFormElement>(".js--account-form");
        if (!form) return;

        const account = typeof accountId === "number" ? this._accounts.find((item) => item.id === accountId) : undefined;
        this._editingAccountId = account?.id ?? null;

        const idInput = form.querySelector<HTMLInputElement>(".js--account-id");
        const nameInput = form.querySelector<HTMLInputElement>(".js--account-name");
        const balanceInput = form.querySelector<HTMLInputElement>(".js--account-balance");
        const currencyInput = form.querySelector<HTMLSelectElement>(".js--account-currency");
        const submit = form.querySelector<HTMLButtonElement>(".js--account-submit");

        if (idInput) idInput.value = account ? String(account.id) : "";
        if (nameInput) nameInput.value = account?.name ?? "";
        if (balanceInput) balanceInput.value = account ? String(account.balance) : "";
        if (currencyInput) currencyInput.value = account?.currency ?? "RUB";
        if (submit) submit.textContent = account ? "Сохранить" : "Создать счёт";

        form.hidden = false;
        this._setAccountStatus(root, "", "neutral", true);
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        nameInput?.focus();
    }

    private _closeAccountForm(root: HTMLElement): void {
        const form = root.querySelector<HTMLFormElement>(".js--account-form");
        form?.reset();
        if (form) form.hidden = true;
        this._editingAccountId = null;
        this._setAccountStatus(root, "", "neutral", true);
    }

    private async _handleAccountSubmit(event: Event, root: HTMLElement): Promise<void> {
        event.preventDefault();
        const form = event.currentTarget as HTMLFormElement;
        const submit = form.querySelector<HTMLButtonElement>(".js--account-submit");
        const name = form.querySelector<HTMLInputElement>(".js--account-name")?.value.trim() ?? "";
        const balanceRaw = form.querySelector<HTMLInputElement>(".js--account-balance")?.value.trim() ?? "";
        const currency = form.querySelector<HTMLSelectElement>(".js--account-currency")?.value ?? "RUB";
        const balance = balanceRaw === "" ? 0 : Number(balanceRaw);

        if (!name) {
            this._setAccountStatus(root, "Название счёта обязательно", "error");
            return;
        }
        if (!Number.isFinite(balance) || balance < 0) {
            this._setAccountStatus(root, "Баланс должен быть числом не меньше 0", "error");
            return;
        }

        if (submit) submit.disabled = true;
        try {
            const successMessage = this._editingAccountId === null ? "Счёт создан" : "Счёт обновлён";
            if (this._editingAccountId === null) {
                const payload: AccountCreateRequest = { name, balance, currency };
                const created = await createAccount(payload);
                if (created.code !== 200 || !created.account) throw new Error(created.message ?? "Счёт не создан");
            } else {
                const payload: AccountUpdateRequest = { name, balance, currency };
                const updated = await updateAccount(this._editingAccountId, payload);
                if (updated.code !== 200 || !updated.account) throw new Error(updated.message ?? "Счёт не обновлён");
            }
            this._closeAccountForm(root);
            this._setAccountStatus(root, successMessage, "success");
            await this._loadAccounts(root);
            await this._refreshBalanceSummary(root);
        } catch (error) {
            this._setAccountStatus(root, error instanceof Error ? error.message : "Ошибка сохранения счёта", "error");
        } finally {
            if (submit) submit.disabled = false;
        }
    }

    private _deleteAccount(root: HTMLElement, id: number): void {
        const account = this._accounts.find((item) => item.id === id);
        const title = account?.name ?? `#${id}`;
        const modal = new Modal({
            title: "Удалить счёт?",
            message: `Вы точно хотите удалить счёт «${title}»? Это действие нельзя отменить.`,
            confirmText: "Удалить",
            cancelText: "Отмена",
            onConfirm: () => {
                void this._handleAccountDelete(root, id, modal);
            },
            onCancel: () => modal.destroy(),
        });

        modal.render(document.body);
    }

    private async _handleAccountDelete(root: HTMLElement, id: number, modal: Modal): Promise<void> {
        try {
            const data = await deleteAccount(id);
            if (data.code !== 200) throw new Error(data.message ?? "Счёт не удалён");

            modal.destroy();
            this._setAccountStatus(root, "Счёт удалён", "success");
            await this._loadAccounts(root);
            await this._refreshBalanceSummary(root);
        } catch (error) {
            modal.show_error(error instanceof Error ? error.message : "Ошибка удаления счёта");
        }
    }

    private async _showAccountDetails(root: HTMLElement, id: number): Promise<void> {
        try {
            const data = await fetchAccount(id);
            if (data.code !== 200 || !data.account) throw new Error(data.message ?? "Счёт не найден");
            this._setAccountStatus(
                root,
                `${data.account.name}: ${this._formatMoney(data.account.balance, data.account.currency)} · создан ${this._formatDate(data.account.created_at)}`,
                "neutral",
            );
        } catch (error) {
            this._setAccountStatus(root, error instanceof Error ? error.message : "Ошибка чтения счёта", "error");
        }
    }

    private _setAccountStatus(root: HTMLElement, text: string, state: "success" | "error" | "neutral", hide = false): void {
        const status = root.querySelector<HTMLElement>(".js--account-status");
        if (!status) return;

        if (this._accountStatusTimer !== null) {
            window.clearTimeout(this._accountStatusTimer);
            this._accountStatusTimer = null;
        }

        status.textContent = text;
        status.hidden = hide || text.length === 0;
        status.className = `accounts-panel__status js--account-status accounts-panel__status--${state}`;

        if (state === "success" && !status.hidden) {
            this._accountStatusTimer = window.setTimeout(() => {
                status.hidden = true;
                status.textContent = "";
                this._accountStatusTimer = null;
            }, 3500);
        }
    }

    private async _refreshBalanceSummary(root: HTMLElement): Promise<void> {
        const balanceData = await this._loadBalance();
        if (balanceData.balances)
            this._balances = this._normalizeBalances(balanceData.balances);

        if (balanceData.loadError) {
            this._showBalanceError(root, "Нет связи с backend. Запусти сервер на 8081 или проверь VITE_SERVER_URL.");
        }

        this._syncCurrencyFilters(root);
        this._renderBalanceSections(root, this._getBalancesForAvailableCurrencies());
        this._applyCurrencyFilter(root);
    }

    private _showBalanceError(root: HTMLElement, text: string): void {
        const error = root.querySelector<HTMLElement>(".js--balance-error");
        if (!error) return;
        error.hidden = false;
        error.textContent = text;
    }

    private _formatMoney(value: number, currency: string): string {
        return `${currency} ${Number(value).toLocaleString("ru-RU", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    private _formatDate(value: string): string {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("ru-RU");
    }

    private _currentMonthLabel(): string {
        const label = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(new Date());
        return label.charAt(0).toUpperCase() + label.slice(1);
    }

    private _escape(value: string): string {
        const map: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };
        return value.replace(/[&<>"']/g, (char) => map[char]);
    }
}
