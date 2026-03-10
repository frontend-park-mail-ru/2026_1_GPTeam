import { BasePage } from "../base_page.js";
import { AuthForm } from "../../components/AuthForm/auth_form.js";

/**
 * Страница входа в систему.
 * Отвечает за рендеринг контейнера страницы и инициализацию формы авторизации
 * в режиме "login".
 * @class LoginPage
 * @extends BasePage
 */
export class LoginPage extends BasePage {
    /**
     * Асинхронно рендерит структуру страницы и форму входа.
     * Настраивает обработчик отправки формы.
     * @async
     * @param {HTMLElement} root - Корневой элемент для отрисовки страницы.
     * @returns {Promise<void>}
     */
    async render(root) {
        root.innerHTML = `
      <div class="page">
        <main class="page__content"></main>
      </div>
    `;

        /**
         * Инициализация формы авторизации.
         * Передаем mode: "login" для соответствующей конфигурации полей и заголовков.
         */
        const form = new AuthForm({ mode: "login" });
        form.render(root.querySelector(".page__content"));

        form._on(form.getElement(), "submit", async (e) => form.submit(e));
        this._components.push(form);
    }
}