import { BasePage } from "../base_page.ts";
import template from "./avatar_edit.hbs?raw";
import { Header } from "../../components/Header/header.ts";
import { AvatarEditForm } from "../../components/AvatarEditForm/avatar_edit_form.ts";
import { router } from "../../router/router_instance.ts";
import "./avatar_edit.css";
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
 * Страница редактирования аватара.
 * Загружает данные профиля для получения инициалов.
 * При ошибке 401 перенаправляет на логин.
 *
 * @class AvatarEditPage
 * @extends BasePage
 */
export class AvatarEditPage extends BasePage {
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

        const initials = data.user.username.slice(0, 2).toUpperCase();

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

        const form = new AvatarEditForm({
            initials,
            onSuccess: () => {
                this._showToast(root, "success");
                setTimeout(() => router.navigate("/profile"), 2000);
            },
            onError: () => {
                this._showToast(root, "error");
            },
        });
        form.render(root.querySelector<HTMLElement>(".avatar-edit__form-container")!);
        this._components.push(form);
    }
}