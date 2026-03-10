import { BaseComponent } from "../base_component.js";
import template from "./header.hbs?raw";
import "./header.css";

/**
 * Компонент шапки сайта (навигации).
 * Отвечает за отображение верхнего меню и автоматическую подсветку 
 * текущей активной ссылки на основе переданного пути.
 * * @class Header
 * @extends BaseComponent
 */
export class Header extends BaseComponent {
    /**
     * Создает экземпляр шапки.
     * @param {Object} props - Свойства компонента.
     * @param {string} props.cur_page - URL текущей страницы для установки активного состояния (например, "/balance").
     */
    constructor(props) {
        super(template, props);
    }

    /**
     * Жизненный цикл компонента: вызывается после рендеринга.
     * Находит все ссылки `<a>` и добавляет класс `active_header_link` той, 
     * чей `href` совпадает с текущей страницей.
     * @private
     */
    _afterRender() {
        let nav = document.getElementsByTagName("a");
        for (let elem of nav)
            if (elem.getAttribute("href") === this._props.cur_page) {
                elem.classList.add("active_header_link");
                if (this._props.cur_page === "/profile") {
                    let icon = elem.getElementsByTagName("img")[0];
                    icon.src = "/icons/profile_active.svg";
                    elem.classList.remove("profile_icon");
                    elem.classList.add("profile_icon_active");
                }
            }
    }
}