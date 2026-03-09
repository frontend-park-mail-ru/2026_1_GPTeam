import { BasePage } from "../base_page.js";
import template from "./landing.hbs?raw";
import "./landing.css";

/**
 * Страница лендинга (приветственная страница).
 * Отвечает за отображение статического контента для неавторизованных пользователей
 * или общей информации о проекте.
 * * @class LandingPage
 * @extends BasePage
 */
export class LandingPage extends BasePage {
    /**
     * Рендерит содержимое лендинга в корневой элемент.
     * Поскольку шаблон импортируется как сырая строка (?raw), 
     * он напрямую записывается в innerHTML.
     * * @async
     * @param {HTMLElement} root - Элемент, в который отрисовывается страница.
     * @returns {Promise<void>}
     */
    async render(root) {
        root.innerHTML = template;
    }
}