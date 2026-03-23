import { BaseComponent } from "../base_component.js";
import template from "./transaction_card.hbs?raw";
import "./transaction_card.css";

export interface TransactionCardProps extends Record<string, unknown> {
    title: string;
    amount: number | string;
    currency: string;
    type: "income" | "expense";
    date: string;
    category_icon: string;
    note?: string;
}

/**
 * Карточка транзакции для страницы операций.
 * Выводит сумму, иконку категории, дату, контекст и быстрые действия.
 */
export class TransactionCard extends BaseComponent {
    constructor(props: TransactionCardProps) {
        const type = props.type === "income" ? "income" : "expense";

        super(template, {
            ...props,
            type,
            amount_sign: type === "income" ? "+" : "−",
            amount: Number(props.amount || 0).toLocaleString("ru-RU"),
        });
    }
}
