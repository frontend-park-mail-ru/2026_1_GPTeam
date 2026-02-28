import { BaseComponent } from "../base_component.js";
import template from "./header.hbs?raw";
import "./header.css";

export class Header extends BaseComponent {
    constructor(props) {
        super(template, props);
    }
}
