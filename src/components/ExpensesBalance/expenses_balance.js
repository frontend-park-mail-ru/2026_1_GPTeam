import {BaseComponent} from "../base_component.js";
import template from "./expenses_balance.hbs?raw";
import "./expenses_balance.css";

export class ExpensesBalance extends BaseComponent {
    constructor(props) {
        super(template, props);
    }
}
