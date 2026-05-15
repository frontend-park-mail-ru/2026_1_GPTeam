import {BaseComponent} from "../base_component.ts";
import template from "./modal_message.hbs?raw";
import "./modal_message.scss";

export class ModalMessage extends BaseComponent {
    protected _close_callback: (() => void) | undefined = undefined;

    constructor(message: string, close_callback?: () => void) {
        super(template, {
            message: message,
        });
        this._close_callback = close_callback;
    }

    protected _afterRender() {
        let btn: HTMLButtonElement | null | undefined = this.getElement()?.querySelector<HTMLButtonElement>(".modal-message__btn");
        if (!btn) {
            return;
        }
        this._on(btn, "click", () => {
            this.destroy();
            if (this._close_callback)
                this._close_callback();
        });
    }
}
