import { BasePage } from "../base_page.ts";
import { AuthForm } from "../../components/AuthForm/auth_form.ts";
import { router } from "../../router/router_instance.ts";
import "./signup.scss";

/**
 * Страница регистрации нового пользователя.
 * Инициализирует форму авторизации в режиме "signup" и настраивает
 * логику взаимодействия.
 *
 * @class SignupPage
 * @extends BasePage
 */
export class SignupPage extends BasePage {
    /**
     * Асинхронно рендерит каркас страницы и форму регистрации.
     * Настраивает обработчик отправки формы.
     *
     * @async
     * @param {HTMLElement} root - Элемент, в который отрисовывается страница.
     * @returns {Promise<void>}
     */
    async render(root: HTMLElement): Promise<void> {
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

        const form = new AuthForm({ mode: "signup" });
        form.render(root.querySelector<HTMLElement>(".page__content")!);
        form.on(form.getElement()!, "submit", async (e) => form.submit(e));
        this._components.push(form);

        root.querySelector<HTMLButtonElement>("#back-btn")?.addEventListener("click", () => {
            router.navigate("/");
        });
    }
}