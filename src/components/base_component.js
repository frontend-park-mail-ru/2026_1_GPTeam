// src/components/BaseComponent.js

import Handlebars from 'handlebars';

/**
 * @module BaseComponent
 * @description Базовый класс для всех UI-компонентов приложения.
 * Обеспечивает lifecycle: render → addEventListeners → update → destroy
 */
export class BaseComponent {
    /**
     * @param {string} template - строка Handlebars-шаблона
     * @param {Object} [props={}] - данные, передаваемые в шаблон
     */
    constructor(template, props = {}) {
        /** @type {HandlebarsTemplateDelegate} */
        this._compiledTemplate = Handlebars.compile(template);

        /** @type {Object} */
        this._props = { ...props };

        /** @type {HTMLElement|null} */
        this._element = null;

        /** @type {HTMLElement|null} */
        this._container = null;

        /**
         * Реестр слушателей для автоматической очистки
         * @type {Array<{element: HTMLElement, event: string, handler: Function}>}
         * @private
         */
        this._listeners = [];

        /**
         * Дочерние компоненты (уничтожаются вместе с родителем)
         * @type {BaseComponent[]}
         * @private
         */
        this._children = [];
    }

    // ==================== Public API ====================

    /**
     * Рендерит компонент в указанный контейнер
     * @param {HTMLElement} container - родительский DOM-элемент
     */
    render(container) {
        this._container = container;
        this._element = this._createElement();
        this._container.appendChild(this._element);
        this._afterRender();
        this._addEventListeners();
    }

    /**
     * Обновляет props и перерисовывает компонент на месте
     * @param {Object} newProps - новые/изменённые свойства
     */
    update(newProps) {
        Object.assign(this._props, newProps);

        if (!this._element || !this._container) return;

        // Снимаем старые слушатели и уничтожаем детей
        this._cleanup();

        // Создаём новый элемент
        const newElement = this._createElement();
        this._container.replaceChild(newElement, this._element);
        this._element = newElement;

        this._afterRender();
        this._addEventListeners();
    }

    /**
     * Полностью удаляет компонент из DOM и очищает ресурсы
     */
    destroy() {
        this._cleanup();
        this._element?.remove();
        this._element = null;
        this._container = null;
    }

    /**
     * Возвращает корневой DOM-элемент компонента
     * @returns {HTMLElement|null}
     */
    getElement() {
        return this._element;
    }

    // ==================== Protected (для наследников) ====================

    /**
     * Навешивание DOM-событий. Переопределяется в наследниках.
     * Всегда используйте this._on() для автоочистки.
     * @protected
     */
    _addEventListeners() {}

    /**
     * Вызывается после вставки в DOM. Удобно для инициализации
     * дочерних компонентов или focus().
     * @protected
     */
    _afterRender() {}

    /**
     * Подписывает элемент на событие с автоматической отпиской при destroy/update
     * @param {HTMLElement} element
     * @param {string} event
     * @param {Function} handler
     * @protected
     */
    _on(element, event, handler) {
        if (!element) {
            console.warn('_on: element is null, event:', event);
            return;
        }
        const bound = handler.bind(this);
        element.addEventListener(event, bound);
        this._listeners.push({ element, event, handler: bound });
    }

    /**
     * Делегирование событий: слушаем на корневом элементе,
     * но срабатывает только если target подходит под selector
     * @param {string} event
     * @param {string} selector
     * @param {Function} handler
     * @protected
     */
    _delegate(event, selector, handler) {
        if (!this._element) return;

        const wrapper = (e) => {
            const target = e.target.closest(selector);
            if (target && this._element.contains(target)) {
                handler.call(this, e, target);
            }
        };

        this._on(this._element, event, wrapper);
    }


    /**
     * Рендерит дочерний компонент внутри текущего
     * @param {BaseComponent} child
     * @param {string} selector - CSS-селектор контейнера внутри текущего шаблона
     * @protected
     */
    _renderChild(child, selector) {
        const container = this._element?.querySelector(selector);
        if (!container) {
            console.warn(`_renderChild: selector "${selector}" не найден`);
            return;
        }
        child.render(container);
        this._children.push(child);
    }

    // ==================== Private ====================

    /**
     * Создаёт DOM-элемент из шаблона
     * @returns {HTMLElement}
     * @private
     */
    _createElement() {
        const html = this._compiledTemplate(this._props).trim();
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Шаблон ДОЛЖЕН иметь один корневой элемент
        if (temp.children.length !== 1) {
            console.warn(
                'BaseComponent: шаблон должен иметь ровно один корневой элемент.',
                'Получено:',
                temp.children.length,
            );
        }

        return temp.firstElementChild;
    }

    /**
     * Снимает слушатели и уничтожает дочерние компоненты
     * @private
     */
    _cleanup() {
        // Слушатели
        this._listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this._listeners = [];

        // Дочерние компоненты
        this._children.forEach((child) => child.destroy());
        this._children = [];
    }
}
