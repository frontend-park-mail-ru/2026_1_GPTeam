import { BaseComponent } from "../base_component.js";
import template from "./modal.hbs?raw";
import "./modal.css";

export class Modal extends BaseComponent {
  constructor(props) {
    super(template, props);
    this._onConfirm = props.onConfirm;
    this._onCancel = props.onCancel;
  }

  _afterRender() {
      const confirmBtn = this._element.querySelector(".modal-btn-confirm");
      const cancelBtn = this._element.querySelector(".modal-btn-cancel");

      this._on(confirmBtn, "click", () => this._onConfirm?.());
      this._on(cancelBtn, "click", () => this._onCancel?.());
      if (this._element) {
          this._on(this._element, "click", (e) => {
              if (e.target === this._element) this._onCancel?.();
          });
      }
  }
}