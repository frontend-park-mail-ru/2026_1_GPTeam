import {BaseComponent} from "../base_component.js";
import "./income_balance.css";
import template from "./income_balance.hbs?raw";

/**
 * Компонент отображения баланса доходов.
 * Представляет собой информационный блок (виджет), предназначенный для 
 * визуализации общей суммы доходов или текущего притока средств.
 * * @class IncomeBalance
 * @extends BaseComponent
 */
export class IncomeBalance extends BaseComponent {
    /**
     * Создает экземпляр компонента баланса доходов.
     * @param {Object} props - Свойства компонента, передаваемые в Handlebars-шаблон.
     * @param {string|number} [props.amount] - Значение баланса для отображения.
     */
    constructor(props) {
        super(template, props);
    }
}