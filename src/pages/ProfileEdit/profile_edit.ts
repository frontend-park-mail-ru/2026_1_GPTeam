import { BasePage } from "../base_page.ts";
import template from "./profile_edit.hbs?raw";
import { Header } from "../../components/Header/header.ts";
import { ProfileAvatar } from "../../components/ProfileAvatar/profile_avatar.ts";
import { ProfileEditForm } from "../../components/ProfileEditForm/profile_edit_form.ts";
import { router } from "../../router/router_instance.ts";
import "./profile_edit.css";
import Handlebars from "handlebars";
import type { SimpleResponse } from "../../types/interfaces.ts";
import { get_profile } from "../../api/profile.ts";

interface ProfileApiResponse extends SimpleResponse {
    user: {
        username: string;
        email: string;
        created_at: string;
        avatar_url: string;
    };
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
    private _showToast(root: HTMLElement, type: "success" | "error", delay = 3000): void {
        const toast = root.querySelector<HTMLElement>(
            type === "success" ? "#toast-success" : "#toast-error"
        );
        if (!toast) return;
        toast.style.display = "inline-flex";
        setTimeout(() => { toast.style.display = "none"; }, delay);
    }

    async render(root: HTMLElement): Promise<void> {
        const data = await get_profile() as ProfileApiResponse;

        if (data.code === 401) {
            router.navigate("/login");
            return;
        }

        const profile = data.user;

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
            avatar_url: profile.avatar_url && profile.avatar_url !== "img/default.png"
                ? `http://localhost:8081/img/${profile.avatar_url}`
                : "",
        });
        avatar.render(root.querySelector<HTMLElement>(".profile-edit__avatar")!);
        this._components.push(avatar);

        const changeBtn = root.querySelector<HTMLElement>("#avatar-change-btn");
        if (changeBtn) {
            changeBtn.addEventListener("click", () => {
                router.navigate("/profile/avatar");
            });
        }

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