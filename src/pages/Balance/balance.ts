import { BasePage } from "../base_page.js";
import template from "./balance.hbs?raw";
import { Header } from "../../components/Header/header.js";
import { get_balance } from "../../api/balance.js";
import { TotalBalance } from "../../components/TotalBalance/total_balance.js";
import "./balance.css";
import Handlebars from "handlebars";
import { IncomeBalance } from "../../components/IncomeBalance/income_balance.js";
import { ExpensesBalance } from "../../components/ExpensesBalance/expenses_balance.js";
import { router } from "../../router/router_instance.js";

/**
 * Ответ сервера с данными баланса пользователя.
 */
interface BalanceResponse {
    code: number;
    date?: string;
    balance?: number;
    currency?: string;
    income?: number;
    expenses?: number;
}

/**
 * Страница баланса пользователя.
 * Отвечает за загрузку финансовых данных, проверку авторизации и
 * инициализацию дочерних компонентов (Header, TotalBalance, IncomeBalance, ExpensesBalance).
 *
 * @class BalancePage
 * @extends BasePage
 */
export class BalancePage extends BasePage {
    /**
     * Асинхронно рендерит страницу в корневой элемент.
     * Выполняет запрос к API, при ошибке 401 перенаправляет на страницу логина.
     * Настраивает сетку виджетов и вставляет скомпилированный шаблон.
     *
     * @async
     * @param {HTMLElement} root - Корневой элемент для отрисовки страницы.
     * @returns {Promise<void>}
     */
    async render(root: HTMLElement): Promise<void> {
        const balance = await get_balance() as BalanceResponse;

        if (balance.code === 401) {
            router.navigate("/login");
            return;
        }

        const compiledTemplate = Handlebars.compile(template);
        const html = compiledTemplate({
            date: balance.date,
        }).trim();

        root.innerHTML = `
            <div class="page">
                <header class="page__header"></header>
                <main class="page__content">${html}</main>
            </div>
        `;

        const header = new Header({ cur_page: "/balance" });
        header.render(root.querySelector<HTMLElement>(".page__header")!);
        this._components.push(header);

        const total_balance = new TotalBalance({
            balance: balance.balance,
            currency: balance.currency,
        });
        total_balance.render(root.querySelector<HTMLElement>(".main_row")!);
        this._components.push(total_balance);

        const income_balance = new IncomeBalance({
            balance: balance.income,
            currency: balance.currency,
        });
        income_balance.render(root.querySelector<HTMLElement>(".row")!);
        this._components.push(income_balance);

        const expenses_balance = new ExpensesBalance({
            balance: balance.expenses,
            currency: balance.currency,
        });
        expenses_balance.render(root.querySelector<HTMLElement>(".row")!);
        this._components.push(expenses_balance);
    }
}