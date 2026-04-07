import { BaseComponent } from "../base_component.ts";
import template from "./avatar_edit_form.hbs?raw";
import { uploadAvatar } from "../../api/avatar.ts";
import { update_profile } from "../../api/profile.ts";
import { router } from "../../router/router_instance.ts";
import { AVATAR_UPDATED_EVENT } from "../Header/header.ts";
import "./avatar_edit_form.css";

/**
 * Интерфейс свойств компонента формы редактирования аватара
 */
interface AvatarEditFormProps {
    /** Callback вызывается при успешном сохранении аватара */
    onSuccess?: () => void;
    /** Callback вызывается при ошибке сохранения аватара */
    onError?: () => void;
    /** Индексная сигнатура для совместимости с BaseComponent */
    [key: string]: unknown;
}

/**
 * Компонент формы редактирования аватара.
 * 
 * Позволяет пользователю выбрать файл изображения, валидирует его,
 * показывает превью в существующем аватаре на странице и отправляет
 * файл на сервер при сохранении.
 * 
 * @example
 * ```typescript
 * const form = new AvatarEditForm({
 *     onSuccess: () => {
 *         showToast("success");
 *         router.navigate("/profile");
 *     },
 *     onError: () => showToast("error")
 * });
 * form.render(container);
 * ```
 * 
 * @class AvatarEditForm
 * @extends BaseComponent
 */
export class AvatarEditForm extends BaseComponent {
    /** Callback для успешного сохранения */
    private _onSuccess?: () => void;
    /** Callback для обработки ошибки */
    private _onError?: () => void;
    /** Выбранный пользователем файл для загрузки */
    private _selectedFile: File | null = null;

    /**
     * Создает экземпляр формы редактирования аватара
     * 
     * @param props - Свойства компонента
     * @param props.onSuccess - Callback, вызываемый после успешного обновления аватара
     * @param props.onError - Callback, вызываемый при ошибке обновления
     */
    constructor(props: AvatarEditFormProps) {
        super(template, props);
        this._onSuccess = props.onSuccess;
        this._onError = props.onError;
    }

    /**
     * Инициализирует обработчики событий для элементов формы
     * 
     * Обрабатывает:
     * - Выбор файла: валидация размера (до 5 МБ) и типа (только изображения)
     * - Превью: обновление существующего аватара на странице через FileReader
     * - Сохранение: загрузка файла на сервер и обновление профиля
     * - Отмена: навигация назад на страницу профиля
     * 
     * @protected
     */
    protected _addEventListeners(): void {
        const el = this.getElement();
        if (!el) return;

        const fileInput = el.querySelector<HTMLInputElement>("#avatar-file-input")!;
        const errorEl = el.querySelector<HTMLElement>("#avatar-error")!;
        const saveBtn = el.querySelector<HTMLButtonElement>("#avatar-save-btn")!;
        const cancelBtn = el.querySelector<HTMLButtonElement>("#avatar-cancel-btn")!;

        // Находим элементы текущего аватара на странице для обновления превью
        const currentAvatarImg = document.getElementById("current-avatar-img") as HTMLImageElement;
        const currentAvatarInitials = document.getElementById("current-avatar-initials") as HTMLElement;

        this._on(cancelBtn, "click", () => router.navigate("/profile"));

        this._on(fileInput, "change", () => {
            const file = fileInput.files?.[0];
            errorEl.innerText = "";
            this._selectedFile = null;

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

            this._selectedFile = file;

            // Обновляем СУЩЕСТВУЮЩИЙ аватар на странице
            const reader = new FileReader();
            reader.onload = (e) => {
                if (currentAvatarImg && currentAvatarInitials) {
                    currentAvatarImg.src = e.target?.result as string;
                    currentAvatarImg.style.display = "block";
                    currentAvatarInitials.style.display = "none";
                }
            };
            reader.readAsDataURL(file);
        });

        this._on(saveBtn, "click", async () => {
            errorEl.innerText = "";

            if (!this._selectedFile) {
                errorEl.innerText = "Выберите фото";
                return;
            }

            saveBtn.disabled = true;

            try {
                const { url: avatarUrl } = await uploadAvatar(this._selectedFile);
                await update_profile({ avatar_url: avatarUrl });
                window.dispatchEvent(new CustomEvent(AVATAR_UPDATED_EVENT));
                this._onSuccess?.();
            } catch (err) {
                errorEl.innerText = err instanceof Error ? err.message : "Не удалось сохранить аватар";
                this._onError?.();
            } finally {
                saveBtn.disabled = false;
            }
        });
    }
}