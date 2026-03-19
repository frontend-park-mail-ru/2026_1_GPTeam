import { BasePage } from "../base_page.js";
import template from "./profile_edit.hbs?raw";
import { Header } from "../../components/Header/header.js";
import { ProfileAvatar } from "../../components/ProfileAvatar/profile_avatar.js";
import { ProfileEditForm } from "../../components/ProfileEditForm/profile_edit_form.js";
import { router } from "../../router/router_instance.js";
import "./profile_edit.css";
import Handlebars from "handlebars";
import type { User, SimpleResponse } from "../../types/interfaces.js";

/** Ответ API на запрос профиля. */
interface ProfileResponse extends SimpleResponse {
    username: User["username"];
    email: User["email"];
    created_at: User["created_at"];
}

/**
 * Страница редактирования профиля пользователя.
 * Инициализирует Header, ProfileAvatar и ProfileEditForm.
 * Показывает toast при успехе или ошибке.
 *
 * @class ProfileEditPage
 * @extends BasePage
 */
export class ProfileEditPage extends BasePage {
    /**
     * Показывает toast и скрывает через delay мс.
     *
     * @private
     * @param {HTMLElement} root - Корневой элемент.
     * @param {"success" | "error"} type - Тип уведомления.
     * @param {number} [delay=3000] - Время показа в мс.
     */
    private _showToast(root: HTMLElement, type: "success" | "error", delay = 3000): void {
        const toast = root.querySelector<HTMLElement>(
            type === "success" ? "#toast-success" : "#toast-error"
        );
        if (!toast) return;
        toast.style.display = "inline-flex";
        setTimeout(() => { toast.style.display = "none"; }, delay);
    }

    /**
     * Асинхронно рендерит страницу редактирования профиля.
     *
     * @async
     * @param {HTMLElement} root - Корневой DOM-элемент.
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
        avatar.render(root.querySelector<HTMLElement>(".profile-edit__avatar")!);
        this._components.push(avatar);

        // Скрываем имя и email — на странице редактирования не нужны
        const avatarName = root.querySelector<HTMLElement>(".profile-avatar__name");
        const avatarEmail = root.querySelector<HTMLElement>(".profile-avatar__email");
        if (avatarName) avatarName.style.display = "none";
        if (avatarEmail) avatarEmail.style.display = "none";

        const form = new ProfileEditForm({
            onSuccess: () => {
                this._showToast(root, "success");
                setTimeout(() => router.navigate("/profile"), 2000);
            },
            onError: () => {
                this._showToast(root, "error");
            },
        });
        form.render(root.querySelector<HTMLElement>(".profile-edit__form-container")!);
        this._components.push(form);
    }
}