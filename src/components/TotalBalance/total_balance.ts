import { BaseComponent } from "../base_component.ts";
import template from "./total_balance.hbs?raw";
import "./total_balance.scss";

interface TotalBalanceProps extends Record<string, unknown> {
    balance?: string | number;
    currency?: string;
}

/**
 * Компонент отображения общего баланса.
 * Служит для визуализации итогового финансового показателя (например, разницы
 * между доходами и расходами) на главной странице или в личном кабинете.
 *
 * @class TotalBalance
 * @extends BaseComponent
 */
export class TotalBalance extends BaseComponent {
    /**
     * Создает экземпляр компонента общего баланса.
     * @param {TotalBalanceProps} props - Свойства компонента.
     */
    constructor(props: TotalBalanceProps) {
        super(template, props);
    }
}