import {BaseComponent} from "../base_component.js";
import template from "./login_form.hbs?raw";

export class LoginForm extends BaseComponent {
    constructor(props) {
        super(template, props);
    }
}