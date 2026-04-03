import { BasePage } from "../base_page.ts";
import template from "./profile.hbs?raw";
import { ProfileAvatar } from "../../components/ProfileAvatar/profile_avatar.ts";
import { ProfileInfo } from "../../components/ProfileInfo/profile_info.ts";
import { router } from "../../router/router_instance.ts";
import "./profile.css";
import Handlebars from "handlebars";
import type { SimpleResponse } from "../../types/interfaces.ts";
import { Modal } from "../../components/Modal/modal.ts";
import { get_profile } from "../../api/profile.ts";
import { logout } from "../../api/auth.ts";

interface ProfileApiResponse extends SimpleResponse {
    user: {
        username: string;
        email: string;
        created_at: string;
        avatar_url: string;
    };
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
    async render(root: HTMLElement): Promise<void> {
        const data = await get_profile() as ProfileApiResponse;

        if (data.code === 401) {
            router.navigate("/login");
            return;
        }

        const profile = data.user;

        const formatDate = (isoDate: string): string => {
            const date = new Date(isoDate);
            return date.toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        };

        const truncate = (str: string, max: number): string =>
            str.length > max ? str.slice(0, max) + "..." : str;

        const compiledTemplate = Handlebars.compile(template);
        root.innerHTML = `
            <div class="page">
                <main class="page__content">${compiledTemplate({}).trim()}</main>
            </div>
        `;

        const avatar = new ProfileAvatar({
            username: profile.username,
            email: profile.email,
            avatar_url: profile.avatar_url && profile.avatar_url !== "img/default.png"
                ? `http://localhost:8081/img/${profile.avatar_url}`
                : "",
        });
        avatar.render(root.querySelector<HTMLElement>(".profile__avatar")!);
        this._components.push(avatar);

        const changeBtn = root.querySelector<HTMLElement>("#avatar-change-btn");
        if (changeBtn) {
            changeBtn.addEventListener("click", () => {
                router.navigate("/profile/avatar");
            });
        }

        const info = new ProfileInfo({
            username: truncate(profile.username, 10),
            email: truncate(profile.email, 10),
            created_at: formatDate(profile.created_at),
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
                        await logout();
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