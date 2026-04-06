import { BaseComponent } from "../base_component.ts";
import template from "./profile_edit_form.hbs?raw";
import "./profile_edit_form.scss";
import {
    is_empty,
    validate_username,
    validate_email,
    validate_password,
    are_password_equal,
} from "../../utils/validation.ts";
import { router } from "../../router/router_instance.ts";
import { update_profile } from "../../api/profile.ts";

interface ProfileEditFormProps extends Record<string, unknown> {
    onSuccess?: () => void;
    onError?: () => void;
    initialUsername?: string;
    initialEmail?: string;
}

/**
 * Компонент формы редактирования профиля.
 * Валидирует логин, email и смену пароля.
 * Вызывает onSuccess/onError колбэки после отправки.
 *
 * @class ProfileEditForm
 * @extends BaseComponent
 */
export class ProfileEditForm extends BaseComponent {
    private _onSuccess?: () => void;
    private _onError?: () => void;
    private _initialUsername: string;
    private _initialEmail: string;

    constructor(props: ProfileEditFormProps) {
        super(template, props);
        this._onSuccess = props.onSuccess;
        this._onError = props.onError;
        this._initialUsername = props.initialUsername ?? "";
        this._initialEmail = props.initialEmail ?? "";
    }

    protected _addEventListeners(): void {
        const form = this.getElement();
        if (!form) return;

        const cancelBtn = form.querySelector<HTMLElement>("#edit-cancel-btn");
        if (cancelBtn) {
            this._on(cancelBtn, "click", () => router.navigate("/profile"));
        }

        this._bindEye(form, "#edit-password-current", "#eye-current");
        this._bindEye(form, "#edit-password-new", "#eye-new");
        this._bindEye(form, "#edit-password-confirm", "#eye-confirm");

        this._on(form, "submit", (e) => this.submit(e as SubmitEvent));
    }

    /**
     * Привязывает кнопку-глазок к полю пароля.
     *
     * @private
     * @param {Element} form - Корневой элемент формы.
     * @param {string} inputId - Селектор поля пароля.
     * @param {string} eyeId - Селектор кнопки-глазка.
     */
    private _bindEye(form: Element, inputId: string, eyeId: string): void {
        const input = form.querySelector<HTMLInputElement>(inputId);
        const eye = form.querySelector<HTMLImageElement>(eyeId);
        if (!input || !eye) return;
        this._on(eye, "click", () => {
            const isVisible = input.type === "text";
            input.type = isVisible ? "password" : "text";
            eye.src = isVisible ? "/icons/closed_eye.svg" : "/icons/opened_eye.svg";
        });
    }

    /**
     * Валидирует поля формы редактирования профиля.
     *
     * @private
     * @param {{ username: HTMLInputElement; email: HTMLInputElement; currentPassword: HTMLInputElement; newPassword: HTMLInputElement; confirmPassword: HTMLInputElement }} fields
     * @param {HTMLElement} errorEl
     * @returns {boolean} true если есть ошибки
     */
    private _validate(
        fields: {
            username: HTMLInputElement;
            email: HTMLInputElement;
            currentPassword: HTMLInputElement;
            newPassword: HTMLInputElement;
            confirmPassword: HTMLInputElement;
        },
        errorEl: HTMLElement
    ): boolean {
        const { username, email, currentPassword, newPassword, confirmPassword } = fields;
        let hasErrors = false;
        errorEl.innerText = "";

        const markInvalid = (input: HTMLInputElement, msg: string): void => {
            input.classList.add("invalid");
            input.classList.remove("valid");
            errorEl.innerText = msg;
            hasErrors = true;
        };

        const markValid = (input: HTMLInputElement): void => {
            input.classList.remove("invalid");
        };

        [username, email, currentPassword, newPassword, confirmPassword].forEach(markValid);

        const anyFilled = [username, email, currentPassword, newPassword, confirmPassword]
            .some(f => f.value.trim());

        if (!anyFilled) {
            errorEl.innerText = "Заполните хотя бы одно поле";
            return true;
        }

        if (username.value.trim()) {
            const [ok, err] = validate_username(username.value);
            if (!ok) markInvalid(username, err);
            else markValid(username);
        }

        if (email.value.trim()) {
            const [ok, err] = validate_email(email.value);
            if (!ok) markInvalid(email, err);
            else markValid(email);
        }

        const anyPassword = currentPassword.value || newPassword.value || confirmPassword.value;
        if (anyPassword) {
            const [okCurrent] = is_empty(currentPassword.value, "Текущий пароль");
            if (!okCurrent) {
                markInvalid(currentPassword, "Введите текущий пароль");
            } else {
                const [okNew, errNew] = validate_password(newPassword.value);
                if (!okNew) {
                    markInvalid(newPassword, errNew);
                } else {
                    const [okConfirm, errConfirm] = are_password_equal(
                        newPassword.value,
                        confirmPassword.value
                    );
                    if (!okConfirm) markInvalid(confirmPassword, errConfirm);
                }
            }
        }

        return hasErrors;
    }

    /**
     * Обработчик отправки формы редактирования профиля.
     *
     * @async
     * @param {SubmitEvent} e
     * @returns {Promise<void>}
     */
    async submit(e: SubmitEvent): Promise<void> {
        e.preventDefault();

        const form = this.getElement();
        if (!form) return;

        const usernameInput = form.querySelector<HTMLInputElement>("#edit-username")!;
        const emailInput = form.querySelector<HTMLInputElement>("#edit-email")!;
        const currentPasswordInput = form.querySelector<HTMLInputElement>("#edit-password-current")!;
        const newPasswordInput = form.querySelector<HTMLInputElement>("#edit-password-new")!;
        const confirmPasswordInput = form.querySelector<HTMLInputElement>("#edit-password-confirm")!;
        const errorEl = form.querySelector<HTMLElement>("#edit-error")!;
        const saveBtn = form.querySelector<HTMLButtonElement>(".profile-edit__btn-save")!;

        const hasErrors = this._validate(
            {
                username: usernameInput,
                email: emailInput,
                currentPassword: currentPasswordInput,
                newPassword: newPasswordInput,
                confirmPassword: confirmPasswordInput,
            },
            errorEl
        );

        if (hasErrors) return;

        saveBtn.disabled = true;

        try {
            const body: Record<string, string> = {};
            body.username = usernameInput.value.trim() || this._initialUsername;
            body.email = emailInput.value.trim() || this._initialEmail;
            if (newPasswordInput.value) {
                body.password = newPasswordInput.value;
                body.current_password = currentPasswordInput.value;
            }

            const result = await update_profile(body);
            if (result.code === 200) {
                this._onSuccess?.();
            } else {
                errorEl.innerText = result.message || "Не удалось обновить профиль";
                this._onError?.();
            }
        } catch {
            errorEl.innerText = "Ошибка сети при обновлении профиля";
            this._onError?.();
        } finally {
            saveBtn.disabled = false;
        }
    }
}