import { BaseComponent } from "../base_component.js";
import template from "./transaction_card.hbs?raw";
import "./transaction_card.css";

/**
 * Карточка/строка транзакции для страницы операций.
 * Компонент отображает сумму, категорию, дату и базовые действия.
 */
export class TransactionCard extends BaseComponent {
    constructor(props) {
        const type = props.type === "income" ? "income" : "expense";

        super(template, {
            ...props,
            type,
            amount_sign: type === "income" ? "+" : "−",
            amount: Number(props.amount || 0).toLocaleString("ru-RU"),
        });
    }
}
