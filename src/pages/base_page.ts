import { BaseComponent } from "../components/base_component.ts";

/**
 * Абстрактный базовый класс для всех страниц приложения.
 * Обеспечивает единый интерфейс жизненного цикла (render/destroy)
 * и автоматическое управление вложенными компонентами.
 *
 * @class BasePage
 */
export class BasePage {
    /**
     * Список активных дочерних компонентов на текущей странице.
     * @type {BaseComponent[]}
     * @protected
     */
    protected _components: BaseComponent[];

    /**
     * Конструктор BasePage.
     */
    constructor() {
        this._components = [];
    }

    /**
     * Асинхронный метод для отрисовки страницы в корневой элемент.
     * @async
     * @param {HTMLElement} _root - Корневой DOM-элемент.
     * @returns {Promise<void>}
     */
    async render(_root: HTMLElement): Promise<void> {}

    /**
     * Производит полную очистку страницы перед её уничтожением.
     * @returns {void}
     */
    destroy(): void {
        this._components.forEach((c) => {
            if (c && typeof c.destroy === "function") {
                c.destroy();
            }
        });
        this._components = [];
    }
}