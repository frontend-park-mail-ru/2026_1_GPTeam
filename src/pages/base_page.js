/**
 * @module BasePage
 * @description Страница — это композиция компонентов
 */
export class BasePage {
    constructor() {
        /** @type {BaseComponent[]} */
        this._components = [];
    }

    /**
     * @param {HTMLElement} root
     */
    async render(root) {
        // Переопределяется в наследниках
    }

    destroy() {
        this._components.forEach((c) => c.destroy());
        this._components = [];
    }
}
