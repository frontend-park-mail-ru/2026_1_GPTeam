import {BaseComponent} from "../base_component.js";
import template from "./total_balance.hbs?raw";
import "./total_balance.css";

export class TotalBalance extends BaseComponent {
    constructor(props) {
        super(template, props);
    }
}
