import Handlebars from "handlebars";

/**
 * Базовый класс для всех компонентов пользовательского интерфейса.
 * Реализует логику жизненного цикла, компиляцию Handlebars-шаблонов,
 * управление событиями и вложенными компонентами.
 * @class BaseComponent
 */
export class BaseComponent {
    /** @private */
    private _compiledTemplate: HandlebarsTemplateDelegate;
    /** @protected */
    protected _props: Record<string, unknown>;
    /** @protected */
    protected _element: HTMLElement | null;
    /** @protected */
    protected _container: HTMLElement | null;
    /** @private */
    private _listeners: { element: HTMLElement; event: string; handler: EventListener }[];
    /** @private */
    private _children: BaseComponent[];

    /**
     * Конструктор BaseComponent.
     * @param {string} template - Строка Handlebars-шаблона.
     * @param {Record<string, unknown>} props - Начальные свойства и данные для шаблона.
     */
    constructor(template: string, props: Record<string, unknown> = {}) {
        this._compiledTemplate = Handlebars.compile(template);
        this._props = { ...props };
        this._element = null;
        this._container = null;
        this._listeners = [];
        this._children = [];
    }

    /**
     * Отрисовывает компонент и вставляет его в указанный контейнер.
     * Инициирует вызовы методов жизненного цикла _afterRender и _addEventListeners.
     * @param {HTMLElement} container - DOM-элемент, в который будет помещен компонент.
     * @returns {void}
     */
    render(container: HTMLElement): void {
        this._container = container;
        this._element = this._createElement();
        this._container.appendChild(this._element);
        this._afterRender();
        this._addEventListeners();
    }

    /**
     * Обновляет состояние компонента новыми свойствами и выполняет перерендер.
     * Перед обновлением производит очистку текущих слушателей и дочерних компонентов.
     * @param {Record<string, unknown>} newProps - Объект с новыми свойствами для слияния с текущими.
     * @returns {void}
     */
    update(newProps: Record<string, unknown>): void {
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
    destroy(): void {
        this._cleanup();
        this._element?.remove();
        this._element = null;
        this._container = null;
    }

    /**
     * Возвращает корневой DOM-элемент скомпилированного компонента.
     * @returns {HTMLElement | null}
     */
    getElement(): HTMLElement | null {
        return this._element;
    }

    /**
     * Публичный метод для регистрации обработчика события снаружи компонента.
     * Делегирует вызов защищённому методу _on для корректного отслеживания слушателей.
     * @param {HTMLElement} element - Элемент, на который вешается событие.
     * @param {string} event - Тип события (например, "submit").
     * @param {EventListener} handler - Функция-обработчик.
     * @returns {void}
     */
    on(element: HTMLElement, event: string, handler: EventListener): void {
        this._on(element, event, handler);
    }

    /**
     * Метод жизненного цикла для навешивания обработчиков событий.
     * Предназначен для переопределения в дочерних классах.
     * @protected
     */
    protected _addEventListeners(): void {}

    /**
     * Метод жизненного цикла, вызываемый сразу после вставки элемента в DOM.
     * Предназначен для манипуляций с DOM или инициализации сторонних библиотек.
     * @protected
     */
    protected _afterRender(): void {}

    /**
     * Регистрирует обработчик события на элементе и сохраняет его для автоматической очистки.
     * Контекст `this` внутри обработчика будет привязан к текущему компоненту.
     * @protected
     * @param {HTMLElement} element - Элемент, на который вешается событие.
     * @param {string} event - Тип события (например, "click").
     * @param {EventListener} handler - Функция-обработчик.
     */
    protected _on(element: HTMLElement, event: string, handler: EventListener): void {
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
    protected _delegate(event: string, selector: string, handler: (e: Event, target: HTMLElement) => void): void {
        if (!this._element) return;

        const wrapper: EventListener = (e: Event) => {
            const target = (e.target as HTMLElement).closest(selector) as HTMLElement;
            if (target && this._element!.contains(target)) {
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
    protected _renderChild(child: BaseComponent, selector: string): void {
        const container = this._element?.querySelector<HTMLElement>(selector);
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
    private _createElement(): HTMLElement {
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

        return temp.firstElementChild as HTMLElement;
    }

    /**
     * Производит внутреннюю очистку: снимает все обработчики событий и
     * вызывает destroy() для всех вложенных дочерних компонентов.
     * @private
     */
    private _cleanup(): void {
        this._listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this._listeners = [];

        this._children.forEach((child) => child.destroy());
        this._children = [];
    }
}