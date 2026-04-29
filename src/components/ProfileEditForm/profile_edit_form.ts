import { BaseComponent } from "../base_component.ts";
import template from "./profile_edit_form.hbs?raw";
import "./profile_edit_form.scss";
import {
    is_empty,
    validate_username,
    validate_email,
} from "../../utils/validation.ts";
import { router } from "../../router/router_instance.ts";
import { update_profile } from "../../api/profile.ts";
import {clean_data} from "../../utils/xss.ts";

interface ProfileEditFormProps extends Record<string, unknown> {
    onSuccess?: () => void;
    onError?: () => void;
    initialUsername?: string;
    initialEmail?: string;
}

/**
 * Компонент формы редактирования профиля.
 * Валидирует логин и email.
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

        this._on(form, "submit", (e) => this.submit(e as SubmitEvent));
    }

    /**
     * Валидирует поля формы редактирования профиля.
     *
     * @private
     * @param {{ username: HTMLInputElement; email: HTMLInputElement }} fields
     * @param {HTMLElement} errorEl
     * @returns {boolean} true если есть ошибки
     */
    private _validate(
        fields: {
            username: HTMLInputElement;
            email: HTMLInputElement;
        },
        errorEl: HTMLElement
    ): boolean {
        Object.entries(fields).forEach(([_, value]) => {
            if (value) {
                value.value = clean_data(value.value);
            }
        });
        const { username, email } = fields;
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

        [username, email].forEach(markValid);

        const anyFilled = [username, email].some(f => f.value.trim() && f.value.trim() !== this._initialUsername && f.value.trim() !== this._initialEmail);

        if (!anyFilled) {
            errorEl.innerText = "Заполните хотя бы одно поле";
            return true;
        }

        if (username.value.trim() && username.value.trim() !== this._initialUsername) {
            const [ok, err] = validate_username(username.value);
            if (!ok) markInvalid(username, err);
            else markValid(username);
        }

        if (email.value.trim() && email.value.trim() !== this._initialEmail) {
            const [ok, err] = validate_email(email.value);
            if (!ok) markInvalid(email, err);
            else markValid(email);
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
        const errorEl = form.querySelector<HTMLElement>("#edit-error")!;
        const saveBtn = form.querySelector<HTMLButtonElement>(".profile-edit__btn-save")!;

        const hasErrors = this._validate(
            {
                username: usernameInput,
                email: emailInput,
            },
            errorEl
        );

        if (hasErrors) return;

        saveBtn.disabled = true;

        try {
            const body: Record<string, string> = {};
            if (usernameInput.value.trim() && usernameInput.value.trim() !== this._initialUsername) {
                body.username = usernameInput.value.trim();
            }
            if (emailInput.value.trim() && emailInput.value.trim() !== this._initialEmail) {
                body.email = emailInput.value.trim();
            }

            if (Object.keys(body).length === 0) {
                errorEl.innerText = "Заполните хотя бы одно поле";
                this._onError?.();
                return;
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
