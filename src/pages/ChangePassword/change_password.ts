import { BasePage } from "../base_page.ts";
import template from "./change_password.hbs?raw";
import { ChangePasswordForm } from "../../components/ChangePasswordForm/change_password_form.ts";
import { router } from "../../router/router_instance.ts";
import "./change_password.scss";
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
 * Страница смены пароля пользователя.
 * Инициализирует ChangePasswordForm.
 * Показывает toast при успехе или ошибке.
 *
 * @class ChangePasswordPage
 * @extends BasePage
 */
export class ChangePasswordPage extends BasePage {
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

        const compiledTemplate = Handlebars.compile(template);
        root.innerHTML = `
            <div class="page">
                <main class="page__content">
                    ${compiledTemplate({}).trim()}
                </main>
            </div>
        `;

        const form = new ChangePasswordForm({
            onSuccess: () => {
                this._showToast(root, "success");
                setTimeout(() => router.navigate("/profile"), 2000);
            },
            onError: () => {
                this._showToast(root, "error");
            },
        });
        form.render(root.querySelector<HTMLElement>(".change-password__form-container")!);
        this._components.push(form);
    }
}
