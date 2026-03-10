import { BaseComponent } from "../base_component.js";
import template from "./modal.hbs?raw";
import "./modal.css";

/**
 * Универсальный компонент модального окна.
 * Управляет отображением диалогового окна, обработкой подтверждения/отмены
 * и закрытием при клике вне контента (на оверлей).
 * * @class Modal
 * @extends BaseComponent
 */
export class Modal extends BaseComponent {
  /**
   * Создает экземпляр модального окна.
   * @param {Object} props - Свойства компонента.
   * @param {string} [props.title] - Заголовок модального окна.
   * @param {string} [props.message] - Текст сообщения внутри окна.
   * @param {Function} [props.onConfirm] - Колбэк-функция, вызываемая при нажатии "Подтвердить".
   * @param {Function} [props.onCancel] - Колбэк-функция, вызываемая при нажатии "Отмена" или закрытии.
   */
  constructor(props) {
    super(template, props);
    this._onConfirm = props.onConfirm;
    this._onCancel = props.onCancel;
  }

  /**
   * Жизненный цикл компонента: вызывается после рендеринга.
   * Настраивает слушатели событий для кнопок управления и закрытия окна по клику на фон.
   * @private
   */
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