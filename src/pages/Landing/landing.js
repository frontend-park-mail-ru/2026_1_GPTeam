import { BasePage } from "../base_page.js";
import template from "./landing.hbs?raw";
import "./landing.css";
import { is_login } from "../../api/auth.js";
import { router } from "../../router/router_instance.js";

/**
 * Страница лендинга (приветственная страница).
 * Неавторизованным пользователям показывает лендинг.
 * При клике на CTA-кнопку проверяет авторизацию:
 * авторизованные перенаправляются на /balance, остальные — на /signup.
 *
 * @class LandingPage
 * @extends BasePage
 */
export class LandingPage extends BasePage {
    /**
     * Рендерит лендинг и навешивает обработчик на кнопку "Начать бесплатно".
     *
     * @async
     * @param {HTMLElement} root - Корневой DOM-элемент, в который отрисовывается страница.
     * @returns {Promise<void>}
     */
    async render(root) {
        root.innerHTML = template;

        root.querySelectorAll(".cta-primary").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                e.preventDefault();
                const authorized = await is_login();
                router.navigate(authorized ? "/balance" : "/signup");
            });
        });
    }
}