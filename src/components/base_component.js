import Handlebars from "handlebars";

/**
 * Базовый класс для всех компонентов пользовательского интерфейса.
 * Реализует логику жизненного цикла, компиляцию Handlebars-шаблонов, 
 * управление событиями и вложенными компонентами.
 * * @class BaseComponent
 */
export class BaseComponent {
    /**
     * Конструктор BaseComponent.
     * @param {string} template - Строка Handlebars-шаблона.
     * @param {Object} [props={}] - Начальные свойства и данные для шаблона.
     */
    constructor(template, props = {}) {
        /** @private */
        this._compiledTemplate = Handlebars.compile(template);
        /** @protected */
        this._props = { ...props };
        /** @protected @type {HTMLElement|null} */
        this._element = null;
        /** @protected @type {HTMLElement|null} */
        this._container = null;
        /** @private */
        this._listeners = [];
        /** @private */
        this._children = [];
    }

    /**
     * Отрисовывает компонент и вставляет его в указанный контейнер.
     * Инициирует вызовы методов жизненного цикла _afterRender и _addEventListeners.
     * @param {HTMLElement} container - DOM-элемент, в который будет помещен компонент.
     * @returns {void}
     */
    render(container) {
        this._container = container;
        this._element = this._createElement();
        this._container.appendChild(this._element);
        this._afterRender();
        this._addEventListeners();
    }

    /**
     * Обновляет состояние компонента новыми свойствами и выполняет перерендер.
     * Перед обновлением производит очистку текущих слушателей и дочерних компонентов.
     * @param {Object} newProps - Объект с новыми свойствами для слияния с текущими.
     * @returns {void}
     */
    update(newProps) {
        Object.assign(this._props, newProps);

        if (!this._element || !this._container) return;

        this._cleanup();

        const newElement = this._createElement();
        this._container.replaceChild(newElement, this._element);
        this._element = newElement;

        this._afterRender();
        this._addEventListeners();
    }

    /**
     * Полностью удаляет компонент из DOM и очищает все связанные ресурсы.
     * @returns {void}
     */
    destroy() {
        this._cleanup();
        this._element?.remove();
        this._element = null;
        this._container = null;
    }

    /**
     * Возвращает корневой DOM-элемент скомпилированного компонента.
     * @returns {HTMLElement|null}
     */
    getElement() {
        return this._element;
    }

    /**
     * Метод жизненного цикла для навешивания обработчиков событий.
     * Предназначен для переопределения в дочерних классах.
     * @protected
     */
    _addEventListeners() {}

    /**
     * Метод жизненного цикла, вызываемый сразу после вставки элемента в DOM.
     * Предназначен для манипуляций с DOM или инициализации сторонних библиотек.
     * @protected
     */
    _afterRender() {}

    /**
     * Регистрирует обработчик события на элементе и сохраняет его для автоматической очистки.
     * Контекст `this` внутри обработчика будет привязан к текущему компоненту.
     * @protected
     * @param {HTMLElement} element - Элемент, на который вешается событие.
     * @param {string} event - Тип события (например, "click").
     * @param {Function} handler - Функция-обработчик.
     */
    _on(element, event, handler) {
        if (!element) {
            console.warn("_on: element is null, event:", event);
            return;
        }
        const bound = handler.bind(this);
        element.addEventListener(event, bound);
        this._listeners.push({ element, event, handler: bound });
    }

    /**
     * Реализует делегирование событий от корневого элемента компонента.
     * @protected
     * @param {string} event - Тип события.
     * @param {string} selector - CSS-селектор целевых элементов.
     * @param {Function} handler - Функция-обработчик.
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
     * Рендерит и монтирует дочерний компонент в указанную точку внутри текущего компонента.
     * @protected
     * @param {BaseComponent} child - Экземпляр дочернего компонента.
     * @param {string} selector - CSS-селектор контейнера внутри текущего элемента.
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

    /**
     * Создает DOM-элемент из скомпилированного шаблона.
     * Требует наличия ровно одного корневого элемента в HTML-разметке шаблона.
     * @private
     * @returns {HTMLElement}
     */
    _createElement() {
        const html = this._compiledTemplate(this._props).trim();
        const temp = document.createElement("div");
        temp.innerHTML = html;

        if (temp.children.length !== 1) {
            console.warn(
                "BaseComponent: шаблон должен иметь ровно один корневой элемент.",
                "Получено:",
                temp.children.length,
            );
        }

        return temp.firstElementChild;
    }

    /**
     * Производит внутреннюю очистку: снимает все обработчики событий и
     * вызывает destroy() для всех вложенных дочерних компонентов.
     * @private
     */
    _cleanup() {
        this._listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this._listeners = [];

        this._children.forEach((child) => child.destroy());
        this._children = [];
    }
}