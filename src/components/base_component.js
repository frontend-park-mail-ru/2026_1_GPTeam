import Handlebars from "handlebars";

export class BaseComponent {
    constructor(template, props = {}) {
        this._compiledTemplate = Handlebars.compile(template);
        this._props = { ...props };
        this._element = null;
        this._container = null;
        this._listeners = [];
        this._children = [];
    }

    render(container) {
        this._container = container;
        this._element = this._createElement();
        this._container.appendChild(this._element);
        this._afterRender();
        this._addEventListeners();
    }

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

    destroy() {
        this._cleanup();
        this._element?.remove();
        this._element = null;
        this._container = null;
    }

    getElement() {
        return this._element;
    }

    _addEventListeners() {}

    _afterRender() {}

    _on(element, event, handler) {
        if (!element) {
            console.warn("_on: element is null, event:", event);
            return;
        }
        const bound = handler.bind(this);
        element.addEventListener(event, bound);
        this._listeners.push({ element, event, handler: bound });
    }

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


    _renderChild(child, selector) {
        const container = this._element?.querySelector(selector);
        if (!container) {
            console.warn(`_renderChild: selector "${selector}" не найден`);
            return;
        }
        child.render(container);
        this._children.push(child);
    }

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

    _cleanup() {
        this._listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this._listeners = [];

        this._children.forEach((child) => child.destroy());
        this._children = [];
    }
}
