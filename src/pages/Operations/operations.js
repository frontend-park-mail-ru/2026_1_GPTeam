import { BasePage } from "../base_page.js";
import { Header } from "../../components/Header/header.js";
import { TransactionCard } from "../../components/TransactionCard/transaction_card.js";
import Handlebars from "handlebars";
import template from "./operations.hbs?raw";
import "./operations.css";

const mockTransactions = [
    {
        title: "Покупка продуктов",
        amount: 3850,
        currency: "RUB",
        type: "expense",
        date: "12 марта 2026",
        category_title: "Еда",
        category_icon: "🍔",
        note: "Перекрёсток",
    },
    {
        title: "Зарплата",
        amount: 120000,
        currency: "RUB",
        type: "income",
        date: "10 марта 2026",
        category_title: "Доход",
        category_icon: "💼",
        note: "Основная работа",
    },
    {
        title: "Такси",
        amount: 740,
        currency: "RUB",
        type: "expense",
        date: "9 марта 2026",
        category_title: "Транспорт",
        category_icon: "🚕",
        note: "Поездка домой",
    },
    {
        title: "Подписка на сервис",
        amount: 599,
        currency: "RUB",
        type: "expense",
        date: "8 марта 2026",
        category_title: "Подписки",
        category_icon: "📺",
        note: "Ежемесячный платёж",
    },
];

/**
 * Страница операций.
 * Показывает журнал транзакций и заготовку для будущих фильтров/создания операции.
 */
export class OperationsPage extends BasePage {
    async render(root) {
        const compiledTemplate = Handlebars.compile(template);
        const html = compiledTemplate({}).trim();

        root.innerHTML = `
            <div class="page">
                <header class="page__header"></header>
                <main class="page__content">${html}</main>
            </div>
        `;

        const header = new Header({
            cur_page: "/operations",
        });
        header.render(root.querySelector(".page__header"));
        this._components.push(header);

        const list = root.querySelector("#transactions_list");
        mockTransactions.forEach((transaction) => {
            const card = new TransactionCard(transaction);
            card.render(list);
            this._components.push(card);
        });
    }
}
