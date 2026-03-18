import { BasePage } from "../base_page.js";
import { Header } from "../../components/Header/header.js";
import template from "./profile.hbs?raw";
import { router } from "../../router/router_instance.js";
import { get_profile } from "../../api/profile.js";
import { logout } from "../../api/auth.js";
import "./profile.css";

/**
 * Страница профиля пользователя.
 * Отвечает за проверку прав доступа (авторизации), отображение личных данных
 * и рендеринг шапки с активным состоянием "/profile".
 *
 * @class ProfilePage
 * @extends BasePage
 */
export class ProfilePage extends BasePage {
    /**
     * Асинхронно рендерит страницу профиля.
     * Сначала отрисовывает базовый каркас, затем запрашивает данные профиля.
     * При получении ошибки 401 выполняет редирект на страницу входа.
     *
     * @async
     * @param {HTMLElement} root - Корневой элемент для отрисовки всей страницы.
     * @returns {Promise<void>}
     */
    async render(root: HTMLElement): Promise<void> {
        root.innerHTML = `
            <div class="page">
                <header class="page__header"></header>
                <main class="page__content">${template}</main>
            </div>
        `;

        const data = await get_profile();
        if (data.code === 401) {
            router.navigate("/login");
            return;
        }

        const header = new Header({ cur_page: "/profile" });
        header.render(root.querySelector<HTMLElement>(".page__header")!);
        this._components.push(header);

        const logout_btn = document.querySelector<HTMLButtonElement>(".logout_btn");
        logout_btn?.addEventListener("click", async () => {
            const ok = await logout();
            if (ok) {
                router.navigate("/");
                return;
            }
            console.error("wrong tokens");
        });
    }
}