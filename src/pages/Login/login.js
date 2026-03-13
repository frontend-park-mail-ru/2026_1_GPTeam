import { BasePage } from "../base_page.js";
import { AuthForm } from "../../components/AuthForm/auth_form.js";
import { router } from "../../router/router_instance.js";
import "./login.css";

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
        <button class="back-btn" id="back-btn">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4L6 9L11 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          На главную
        </button>
        <main class="page__content"></main>
      </div>
    `;

        const form = new AuthForm({ mode: "login" });
        form.render(root.querySelector(".page__content"));

        form._on(form.getElement(), "submit", async (e) => form.submit(e));
        this._components.push(form);

        root.querySelector("#back-btn").addEventListener("click", () => {
            router.navigate("/");
        });
    }
}