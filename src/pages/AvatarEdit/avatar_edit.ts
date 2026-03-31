import { BasePage } from "../base_page.ts";
import template from "./avatar_edit.hbs?raw";
import { AvatarEditForm } from "../../components/AvatarEditForm/avatar_edit_form.ts";
import { router } from "../../router/router_instance.ts";
import "./avatar_edit.css";
import Handlebars from "handlebars";
import type { SimpleResponse } from "../../types/interfaces.ts";
import { get_profile } from "../../api/profile.ts";

/**
 * Интерфейс ответа API профиля
 */
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
 * Загружает данные профиля для отображения текущего аватара и получения инициалов.
 * При ошибке 401 перенаправляет на страницу входа.
 * 
 * @example
 * ```typescript
 * const page = new AvatarEditPage();
 * page.render(document.getElementById('app'));
 * ```
 * 
 * @class AvatarEditPage
 * @extends BasePage
 */
export class AvatarEditPage extends BasePage {
    /**
     * Показывает toast-уведомление
     * @param root - Корневой элемент страницы
     * @param type - Тип уведомления ("success" или "error")
     * @param delay - Время отображения в миллисекундах (по умолчанию 3000)
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
     * Рендерит страницу редактирования аватара
     * Загружает данные профиля, отображает текущий аватар и форму загрузки нового
     * @param root - Корневой HTML элемент для рендеринга
     * @returns Promise<void>
     */
    async render(root: HTMLElement): Promise<void> {
        const data = await get_profile() as ProfileApiResponse;

        if (data.code === 401) {
            router.navigate("/login");
            return;
        }

        const initials = data.user.username.slice(0, 2).toUpperCase();
        
        const avatarUrl = data.user.avatar_url 
            ? data.user.avatar_url.startsWith('http') 
                ? data.user.avatar_url 
                : `${import.meta.env.VITE_SERVER_URL}/img/${data.user.avatar_url}`
            : '';

        const compiledTemplate = Handlebars.compile(template);
        root.innerHTML = `
            <div class="page">
                <main class="page__content">
                    ${compiledTemplate({ 
                        avatar_url: avatarUrl, 
                        initials: initials 
                    }).trim()}
                </main>
            </div>
        `;

        const form = new AvatarEditForm({
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