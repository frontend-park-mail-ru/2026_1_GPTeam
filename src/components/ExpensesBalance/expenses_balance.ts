import { BaseComponent } from "../base_component.ts";
import template from "./expenses_balance.hbs?raw";
import "./expenses_balance.css";

/**
 * Компонент отображения баланса расходов.
 * Представляет собой визуальный блок (виджет), отображающий текущее состояние
 * финансовых средств или сводку по расходам на основе переданных свойств.
 *
 * @class ExpensesBalance
 * @extends BaseComponent
 */
export class ExpensesBalance extends BaseComponent {
    /**
     * Создает экземпляр компонента баланса расходов.
     * @param {Record<string, unknown>} props - Свойства компонента, используемые в Handlebars-шаблоне.
     */
    constructor(props: Record<string, unknown>) {
        super(template, props);
    }
}