import { BaseComponent } from "../base_component.js";
import template from "./modal_form.hbs?raw";
import "./modal_form.css";

export class ModalForm extends BaseComponent {
    constructor(props) {
        super(template, props);
        this._onClose = props.onClose;
    }
    
    _afterRender() {
        const closeBtn = this._element.querySelector(".modal-form-close-btn");
        if (closeBtn) {
            this._on(closeBtn, "click", () => this._onClose?.());
        }
        if (this._element) {
            this._on(this._element, "click", (e) => {
                if (e.target === this._element) this._onClose?.();
            });
        }
    }

    getFormContainer() {
        return this._element.querySelector("#form_container");
    }
}