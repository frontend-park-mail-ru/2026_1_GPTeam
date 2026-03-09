import { BasePage } from "../base_page.js";
import { AuthForm } from "../../components/AuthForm/auth_form.js";

/**
 * Страница регистрации нового пользователя.
 * Инициализирует форму авторизации в режиме "signup" и настраивает
 * логику взаимодействия.
 * @class SignupPage
 * @extends BasePage
 */
export class SignupPage extends BasePage {
    /**
     * Асинхронно рендерит каркас страницы и форму регистрации.
     * Настраивает обработчик отправки формы.
     * @async
     * @param {HTMLElement} root - Элемент, в который отрисовывается страница.
     * @returns {Promise<void>}
     */
    async render(root) {
        root.innerHTML = `
      <div class="page">
        <main class="page__content"></main>
      </div>
    `;

        /**
         * Инициализация формы в режиме регистрации.
         * В этом режиме AuthForm отображает дополнительные поля: подтверждение пароля и email.
         */
        const form = new AuthForm({ mode: "signup" });
        form.render(root.querySelector(".page__content"));

        form._on(form.getElement(), "submit", async (e) => form.submit(e));
        this._components.push(form);
    }
}