import { BaseComponent } from "../base_component.js";
import template from "./header.hbs?raw";
import "./header.css";

interface HeaderProps extends Record<string, unknown> {
    cur_page: string;
}

/**
 * Компонент шапки сайта (навигации).
 * Отвечает за отображение верхнего меню и автоматическую подсветку
 * текущей активной ссылки на основе переданного пути.
 *
 * @class Header
 * @extends BaseComponent
 */
export class Header extends BaseComponent {
    /**
     * Создает экземпляр шапки.
     * @param {HeaderProps} props - Свойства компонента.
     */
    constructor(props: HeaderProps) {
        super(template, props);
    }

    /**
     * Жизненный цикл компонента: вызывается после рендеринга.
     * Находит все ссылки `<a>` и добавляет класс `active_header_link` той,
     * чей `href` совпадает с текущей страницей.
     * @protected
     */
    protected _afterRender(): void {
        const nav = document.getElementsByTagName("a");
        for (const elem of nav) {
            if (elem.getAttribute("href") === this._props.cur_page) {
                elem.classList.add("active_header_link");
                if (this._props.cur_page === "/profile") {
                    const icon = elem.getElementsByTagName("img")[0];
                    if (icon) icon.src = "/icons/profile_active.svg";
                    elem.classList.remove("profile_icon");
                    elem.classList.add("profile_icon_active");
                }
            }
        }
    }
}