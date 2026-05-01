import { BaseComponent } from "../base_component.ts";
import template from "./toast.hbs?raw";
import "./toast.scss";

export type ToastType = "success" | "error";

export interface ToastOptions {
    type: ToastType;
    message: string;
    duration?: number;
    onClose?: () => void;
}

/**
 * Компонент всплывающего уведомления (toast).
 * Показывает сообщения об успехе или ошибке с возможностью автоматического закрытия.
 *
 * @class Toast
 * @extends BaseComponent
 */
export class Toast extends BaseComponent {
    private _timeoutId: number | null = null;
    private _onClose?: () => void;

    constructor(options: ToastOptions) {
        const icon = options.type === "success" ? "✓" : "✕";
        super(template, {
            type: options.type,
            message: options.message,
            icon,
        });
        this._onClose = options.onClose;
    }

    protected override _afterRender(): void {
        const closeBtn = this._element?.querySelector<HTMLElement>("[data-toast-close]");
        if (closeBtn) {
            this._on(closeBtn, "click", () => this.hide());
        }
    }

    /**
     * Показывает уведомление и запускает таймер автоматического закрытия.
     * @param {number} duration - Время до автоматического закрытия в миллисекундах (по умолчанию 5000).
     */
    show(duration = 5000): void {
        if (this._timeoutId !== null) {
            window.clearTimeout(this._timeoutId);
        }

        this._timeoutId = window.setTimeout(() => {
            this.hide();
        }, duration);
    }

    /**
     * Скрывает уведомление с анимацией и удаляет его из DOM.
     */
    hide(): void {
        if (this._timeoutId !== null) {
            window.clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }

        this._element?.classList.add("toast--hiding");

        setTimeout(() => {
            this.destroy();
            this._onClose?.();
        }, 300);
    }
}

/**
 * Контейнер для управления всплывающими уведомлениями.
 * Создаёт и отображает уведомления в фиксированной позиции на странице.
 */
export class ToastContainer {
    private static _container: HTMLElement | null = null;
    private static _toasts: Toast[] = [];

    /**
     * Инициализирует контейнер для уведомлений.
     * Вызывается автоматически при первом вызове show().
     */
    private static _ensureContainer(): void {
        if (this._container) return;

        this._container = document.createElement("div");
        this._container.className = "toast-container";
        this._container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(this._container);
    }

    /**
     * Показывает уведомление указанного типа.
     * @param {ToastType} type - Тип уведомления (success или error).
     * @param {string} message - Текст сообщения.
     * @param {number} duration - Время до автоматического закрытия в миллисекундах.
     */
    static show(type: ToastType, message: string, duration = 5000): void {
        this._ensureContainer();

        const toast = new Toast({ type, message });
        this._toasts.push(toast);

        toast.render(this._container!);
        toast.show(duration);

        toast.on(toast.getElement()!, "destroy", () => {
            this._toasts = this._toasts.filter(t => t !== toast);
        });
    }

    /**
     * Показывает уведомление об успехе.
     * @param {string} message - Текст сообщения.
     * @param {number} duration - Время до автоматического закрытия в миллисекундах.
     */
    static success(message: string, duration = 5000): void {
        this.show("success", message, duration);
    }

    /**
     * Показывает уведомление об ошибке.
     * @param {string} message - Текст сообщения.
     * @param {number} duration - Время до автоматического закрытия в миллисекундах.
     */
    static error(message: string, duration = 5000): void {
        this.show("error", message, duration);
    }

    /**
     * Удаляет все активные уведомления.
     */
    static clear(): void {
        this._toasts.forEach(toast => toast.destroy());
        this._toasts = [];
    }
}
