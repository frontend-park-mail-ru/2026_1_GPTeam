import { BasePage } from "../base_page.ts";
import template from "./landing.hbs?raw";
import "./landing.scss";
import { is_login } from "../../api/auth.ts";
import { router } from "../../router/router_instance.ts";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";

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
     * Рендерит лендинг и навешивает обработчики.
     * — Кнопка профиля: авторизованные → /profile, остальные → /login
     * — Индикатор: зелёный «Вы вошли» или красный «Вы не вошли»
     * — CTA-кнопки: авторизованные → /balance, остальные → /signup
     *
     * @async
     * @param {HTMLElement} root - Корневой DOM-элемент, в который отрисовывается страница.
     * @returns {Promise<void>}
     */
    async render(root: HTMLElement): Promise<void> {
        root.innerHTML = template;

        const authorized = await is_login();

        const indicatorIn = root.querySelector<HTMLElement>("#auth-indicator-in");
        const indicatorOut = root.querySelector<HTMLElement>("#auth-indicator-out");

        if (authorized) {
            if (indicatorIn) indicatorIn.style.display = "inline-flex";
            if (indicatorOut) indicatorOut.style.display = "none";
        } else {
            if (indicatorOut) indicatorOut.style.display = "inline-flex";
            if (indicatorIn) indicatorIn.style.display = "none";
        }

        const profileBtn = root.querySelector<HTMLElement>("#profile-btn");
        if (profileBtn) {
            profileBtn.style.cursor = "pointer";
            profileBtn.addEventListener("click", (e) => {
                e.preventDefault();
                router.navigate(authorized ? "/profile" : "/login");
            });
        }

        root.querySelectorAll<HTMLElement>(".landing__cta-primary").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                router.navigate(authorized ? "/balance" : "/signup");
            });
        });
    }
}