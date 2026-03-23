import { BaseComponent } from "../base_component.ts";
import template from "./modal.hbs?raw";
import "./modal.css";

interface ModalProps extends Record<string, unknown> {
    title?: string;
    message?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

/**
 * Универсальный компонент модального окна.
 * Управляет отображением диалогового окна, обработкой подтверждения/отмены
 * и закрытием при клике вне контента (на оверлей).
 *
 * @class Modal
 * @extends BaseComponent
 */
export class Modal extends BaseComponent {
    private _onConfirm?: () => void;
    private _onCancel?: () => void;

    /**
     * Создает экземпляр модального окна.
     * @param {ModalProps} props - Свойства компонента.
     */
    constructor(props: ModalProps) {
        super(template, props);
        this._onConfirm = props.onConfirm;
        this._onCancel = props.onCancel;
    }

    /**
     * Жизненный цикл компонента: вызывается после рендеринга.
     * Настраивает слушатели событий для кнопок управления и закрытия окна по клику на фон.
     * @protected
     */
    protected _afterRender(): void {
        const confirmBtn = this._element?.querySelector<HTMLElement>(".modal-btn-confirm");
        const cancelBtn = this._element?.querySelector<HTMLElement>(".modal-btn-cancel");

        if (confirmBtn) this._on(confirmBtn, "click", () => this._onConfirm?.());
        if (cancelBtn) this._on(cancelBtn, "click", () => this._onCancel?.());
        if (this._element) {
            this._on(this._element, "click", (e) => {
                if (e?.target === this._element) this._onCancel?.();
            });
        }
    }
}