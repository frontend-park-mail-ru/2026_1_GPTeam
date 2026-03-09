import {BaseComponent} from "../base_component.js";
import template from "./total_balance.hbs?raw";
import "./total_balance.css";

/**
 * Компонент отображения общего баланса.
 * Служит для визуализации итогового финансового показателя (например, разницы 
 * между доходами и расходами) на главной странице или в личном кабинете.
 * * @class TotalBalance
 * @extends BaseComponent
 */
export class TotalBalance extends BaseComponent {
    /**
     * Создает экземпляр компонента общего баланса.
     * @param {Object} props - Свойства компонента.
     * @param {string|number} [props.balance] - Значение общего баланса для отображения.
     * @param {string} [props.currency] - Символ или код валюты.
     */
    constructor(props) {
        super(template, props);
    }
}