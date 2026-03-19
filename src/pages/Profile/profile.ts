import { BasePage } from "../base_page.js";
import template from "./profile.hbs?raw";
import { Header } from "../../components/Header/header.js";
import { ProfileAvatar } from "../../components/ProfileAvatar/profile_avatar.js";
import { ProfileInfo } from "../../components/ProfileInfo/profile_info.js";
import { router } from "../../router/router_instance.js";
import "./profile.css";
import Handlebars from "handlebars";
import type { User, SimpleResponse } from "../../types/interfaces.js";
import { Modal } from "../../components/Modal/modal.js";

/** Ответ API на запрос профиля. */
interface ProfileResponse extends SimpleResponse {
    username: User["username"];
    email: User["email"];
    created_at: User["created_at"];
}

/**
 * Страница профиля пользователя.
 * Загружает данные пользователя с сервера и инициализирует
 * компоненты: Header, ProfileAvatar, ProfileInfo.
 * При ошибке 401 перенаправляет на страницу логина.
 *
 * @class ProfilePage
 * @extends BasePage
 */
export class ProfilePage extends BasePage {
    /**
     * Асинхронно рендерит страницу профиля в корневой элемент.
     *
     * @async
     * @param {HTMLElement} root - Корневой DOM-элемент для отрисовки страницы.
     * @returns {Promise<void>}
     */
    async render(root: HTMLElement): Promise<void> {
        // TODO: заменить на get_profile() когда появится эндпоинт
        const profile: ProfileResponse = {
            code: 200,
            username: "username",
            email: "user@email.com",
            created_at: "1 января 2026",
        };

        if (profile.code === 401) {
            router.navigate("/login");
            return;
        }

        const compiledTemplate = Handlebars.compile(template);
        root.innerHTML = `
            <div class="page">
                <header class="page__header"></header>
                <main class="page__content">${compiledTemplate({}).trim()}</main>
            </div>
        `;

        const header = new Header({ cur_page: "/profile" });
        header.render(root.querySelector<HTMLElement>(".page__header")!);
        this._components.push(header);

        const avatar = new ProfileAvatar({
            username: profile.username,
            email: profile.email,
        });
        avatar.render(root.querySelector<HTMLElement>(".profile__avatar")!);
        this._components.push(avatar);

        const info = new ProfileInfo({
            username: profile.username,
            email: profile.email,
            created_at: profile.created_at,
        });
        info.render(root.querySelector<HTMLElement>(".profile__info")!);
        this._components.push(info);

        root.querySelector<HTMLElement>("#profile-edit-btn")!
            .addEventListener("click", () => {
                router.navigate("/profile/edit");
            });

        root.querySelector<HTMLElement>("#profile-logout-btn")!
            .addEventListener("click", () => {
                const modal = new Modal({
                    title: "Выйти из аккаунта?",
                    message: "",
                    confirmText: "Выйти",
                    cancelText: "Отмена",
                    onConfirm: async () => {
                        modal.destroy();
                        // TODO: await logout();
                        router.navigate("/");
                    },
                    onCancel: () => {
                        modal.destroy();
                    },
                });
                modal.render(root);
            });
    }
}