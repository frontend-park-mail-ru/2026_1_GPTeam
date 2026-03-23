import { BaseComponent } from "../base_component.ts";
import template from "./modal_form.hbs?raw";
import "./modal_form.css";

interface ModalFormProps extends Record<string, unknown> {
    onClose?: () => void;
}

/**
 * Компонент-контейнер для форм в модальном окне.
 * Обеспечивает базовую структуру модального окна (оверлей, кнопка закрытия)
 * и предоставляет точку монтирования для содержимого формы.
 *
 * @class ModalForm
 * @extends BaseComponent
 */
export class ModalForm extends BaseComponent {
    private _onClose?: () => void;

    /**
     * Создает экземпляр контейнера модальной формы.
     * @param {ModalFormProps} props - Свойства компонента.
     */
    constructor(props: ModalFormProps) {
        super(template, props);
        this._onClose = props.onClose;
    }

    /**
     * Жизненный цикл компонента: вызывается после рендеринга.
     * Настраивает обработчики закрытия окна через кнопку `.modal-form-close-btn`
     * или клик по подложке (оверлею).
     * @protected
     */
    protected _afterRender(): void {
        const closeBtn = this._element?.querySelector<HTMLElement>(".modal-form-close-btn");
        if (closeBtn) {
            this._on(closeBtn, "click", () => this._onClose?.());
        }
        if (this._element) {
            this._on(this._element, "click", (e) => {
                if (e?.target === this._element) this._onClose?.();
            });
        }
    }

    /**
     * Возвращает DOM-элемент контейнера, в который должна быть вставлена форма.
     * Используется для динамического рендеринга внутреннего контента.
     * @returns {HTMLElement | null} Элемент с id `form_container`.
     */
    getFormContainer(): HTMLElement | null {
        return this._element?.querySelector("#form_container") ?? null;
    }
}