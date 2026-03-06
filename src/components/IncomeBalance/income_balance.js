import {BaseComponent} from "../base_component.js";
import "./income_balance.css";
import template from "./income_balance.hbs?raw";

export class IncomeBalance extends BaseComponent {
    constructor(props) {
        super(template, props);
    }
}