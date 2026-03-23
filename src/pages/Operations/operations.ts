import { BasePage } from "../base_page.js";
import { Header } from "../../components/Header/header.js";
import {
    TransactionCard,
    type TransactionCardProps,
} from "../../components/TransactionCard/transaction_card.js";
import Handlebars from "handlebars";
import template from "./operations.hbs?raw";
import "./operations.css";

interface OperationsFilter {
    label: string;
    class_name: string;
}

interface OperationsStat {
    label: string;
    value: string;
    class_name: string;
}

const mockTransactions: TransactionCardProps[] = [
    {
        title: "Покупка продуктов",
        amount: 3850,
        currency: "RUB",
        type: "expense",
        date: "12 марта 2026",
        category_icon: "🍔",
        note: "Перекрёсток",
    },
    {
        title: "Зарплата",
        amount: 120000,
        currency: "RUB",
        type: "income",
        date: "10 марта 2026",
        category_icon: "💼",
        note: "Основная работа",
    },
    {
        title: "Такси",
        amount: 740,
        currency: "RUB",
        type: "expense",
        date: "9 марта 2026",
        category_icon: "🚕",
        note: "Поездка домой",
    },
];

const filters: OperationsFilter[] = [
    { label: "Все", class_name: "transactions-filter transactions-filter--active" },
    { label: "Доходы", class_name: "transactions-filter" },
    { label: "Расходы", class_name: "transactions-filter" },
    { label: "За месяц", class_name: "transactions-filter" },
];

/**
 * Страница транзакций.
 * Использует общую обвязку страницы, общий Header и отдельные карточки транзакций.
 */
export class OperationsPage extends BasePage {
    async render(root: HTMLElement): Promise<void> {
        const incomeTotal = mockTransactions
            .filter((transaction) => transaction.type === "income")
            .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

        const expenseTotal = mockTransactions
            .filter((transaction) => transaction.type === "expense")
            .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

        const stats: OperationsStat[] = [
            {
                label: "Транзакций",
                value: String(mockTransactions.length),
                class_name: "transactions-stat",
            },
            {
                label: "Доходы",
                value: `RUB ${incomeTotal.toLocaleString("ru-RU")}`,
                class_name: "transactions-stat transactions-stat--income",
            },
            {
                label: "Расходы",
                value: `RUB ${expenseTotal.toLocaleString("ru-RU")}`,
                class_name: "transactions-stat transactions-stat--expense",
            },
        ];

        const compiledTemplate = Handlebars.compile(template);
        const html = compiledTemplate({
            filters,
            stats,
        }).trim();

        root.innerHTML = `
            <div class="page">
                <header class="page__header"></header>
                <main class="page__content page__content--transactions">${html}</main>
            </div>
        `;

        const header = new Header({
            cur_page: "/operations",
        });
        header.render(root.querySelector<HTMLElement>(".page__header")!);
        this._components.push(header);

        const list = root.querySelector<HTMLElement>("#transactions_list");
        if (!list) return;

        mockTransactions.forEach((transaction) => {
            const card = new TransactionCard(transaction);
            card.render(list);
            this._components.push(card);
        });
    }
}
