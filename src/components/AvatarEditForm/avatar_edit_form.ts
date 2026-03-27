import { BaseComponent } from "../base_component.ts";
import template from "./avatar_edit_form.hbs?raw";
import { uploadAvatar } from "../../api/avatar.ts";
import "./avatar_edit_form.css";
import { router } from "../../router/router_instance.ts";
import { update_profile } from "../../api/profile.ts";

interface AvatarEditFormProps extends Record<string, unknown> {
    initials: string;
    onSuccess?: () => void;
    onError?: () => void;
}

/**
 * Компонент формы редактирования аватара.
 * Позволяет выбрать файл, показывает превью.
 * Вызывает onSuccess/onError после сохранения.
 *
 * @class AvatarEditForm
 * @extends BaseComponent
 */
export class AvatarEditForm extends BaseComponent {
    private _onSuccess?: () => void;
    private _onError?: () => void;

    constructor(props: AvatarEditFormProps) {
        super(template, props);
        this._onSuccess = props.onSuccess;
        this._onError = props.onError;
    }

    protected _addEventListeners(): void {
        const el = this.getElement();
        if (!el) return;

        const fileInput = el.querySelector<HTMLInputElement>("#avatar-file-input")!;
        const previewImg = el.querySelector<HTMLImageElement>("#avatar-preview-img")!;
        const previewInitials = el.querySelector<HTMLElement>("#avatar-preview-initials")!;
        const errorEl = el.querySelector<HTMLElement>("#avatar-error")!;
        const saveBtn = el.querySelector<HTMLButtonElement>("#avatar-save-btn")!;
        const cancelBtn = el.querySelector<HTMLButtonElement>("#avatar-cancel-btn")!;

        this._on(cancelBtn, "click", () => router.navigate("/profile"));

        this._on(fileInput, "change", () => {
            const file = fileInput.files?.[0];
            errorEl.innerText = "";

            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                errorEl.innerText = "Файл слишком большой. Максимум 5 МБ";
                fileInput.value = "";
                return;
            }

            if (!file.type.startsWith("image/")) {
                errorEl.innerText = "Можно загружать только изображения";
                fileInput.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target?.result as string;
                previewImg.style.display = "block";
                previewInitials.style.display = "none";
            };
            reader.readAsDataURL(file);
        });

        this._on(saveBtn, "click", async () => {
            const file = fileInput.files?.[0];
            errorEl.innerText = "";

            if (!file) {
                errorEl.innerText = "Выберите фото";
                return;
            }

            saveBtn.disabled = true;

            try {
                const { url: avatarUrl } = await uploadAvatar(file);

                await update_profile({ avatar_url: avatarUrl });

                this._onSuccess?.();
            } catch (err) {
                errorEl.innerText = err instanceof Error
                    ? err.message
                    : "Не удалось сохранить аватар";
                this._onError?.();
            } finally {
                saveBtn.disabled = false;
            }
        });
    }
}