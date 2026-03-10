import { BaseComponent } from "../base_component.js";
import template from "./modal_form.hbs?raw";
import "./modal_form.css";

/**
 * Компонент-контейнер для форм в модальном окне.
 * Обеспечивает базовую структуру модального окна (оверлей, кнопка закрытия)
 * и предоставляет точку монтирования для содержимого формы.
 * * @class ModalForm
 * @extends BaseComponent
 */
export class ModalForm extends BaseComponent {
    /**
     * Создает экземпляр контейнера модальной формы.
     * @param {Object} props - Свойства компонента.
     * @param {Function} [props.onClose] - Колбэк-функция, вызываемая при закрытии окна (клик по кнопке или фону).
     */
    constructor(props) {
        super(template, props);
        this._onClose = props.onClose;
    }
    
    /**
     * Жизненный цикл компонента: вызывается после рендеринга.
     * Настраивает обработчики закрытия окна через кнопку `.modal-form-close-btn`
     * или клик по подложке (оверлею).
     * @private
     */
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

    /**
     * Возвращает DOM-элемент контейнера, в который должна быть вставлена форма.
     * Используется для динамического рендеринга внутреннего контента.
     * @returns {HTMLElement|null} Элемент с id `form_container`.
     */
    getFormContainer() {
        return this._element.querySelector("#form_container");
    }
}