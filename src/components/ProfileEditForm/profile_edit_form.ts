import { BaseComponent } from "../base_component.js";
import template from "./profile_edit_form.hbs?raw";
import "./profile_edit_form.css";
import {
    is_empty,
    validate_username,
    validate_email,
    validate_password,
    are_password_equal,
} from "../../utils/validation.js";
import { router } from "../../router/router_instance.js";

interface ProfileEditFormProps extends Record<string, unknown> {
    onSuccess?: () => void;
    onError?: () => void;
}

/**
 * Компонент формы редактирования профиля.
 * Валидирует логин, email и смену пароля.
 * Вызывает onSuccess/onError колбэки после отправки.
 *
 * @class ProfileEditForm
 * @extends BaseComponent
 *
 * @example
 * const form = new ProfileEditForm({
 *   onSuccess: () => showToast("success"),
 *   onError: () => showToast("error"),
 * });
 * form.render(container);
 */
export class ProfileEditForm extends BaseComponent {
    private _onSuccess?: () => void;
    private _onError?: () => void;

    /**
     * @param {ProfileEditFormProps} props - Колбэки успеха и ошибки.
     */
    constructor(props: ProfileEditFormProps) {
        super(template, props);
        this._onSuccess = props.onSuccess;
        this._onError = props.onError;
    }

    /**
     * Навешивает обработчики после рендера.
     * @protected
     */
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
     * Валидирует поля формы.
     * Логин и email — только если заполнены.
     * Пароли — только если заполнено хотя бы одно поле пароля.
     *
     * @private
     * @param fields - DOM-элементы полей.
     * @param {HTMLElement} errorEl - Элемент для вывода ошибки.
     * @returns {boolean} true если есть ошибки.
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

        // Хотя бы одно поле должно быть заполнено
        const anyFilled = [username, email, currentPassword, newPassword, confirmPassword]
            .some(f => f.value.trim());

        if (!anyFilled) {
            errorEl.innerText = "Заполните хотя бы одно поле";
            return true;
        }

        // Валидация логина если заполнен
        if (username.value.trim()) {
            const [ok, err] = validate_username(username.value);
            if (!ok) markInvalid(username, err);
            else markValid(username);
        }

        // Валидация email если заполнен
        if (email.value.trim()) {
            const [ok, err] = validate_email(email.value);
            if (!ok) markInvalid(email, err);
            else markValid(email);
        }

        // Валидация паролей если заполнено хотя бы одно
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
     * Обработчик отправки формы.
     * Валидирует поля, отправляет запрос на сервер.
     * Вызывает onSuccess или onError в зависимости от результата.
     *
     * @async
     * @param {SubmitEvent} e - Событие submit.
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
            // TODO: заменить на реальный API вызов когда появится эндпоинт
            this._onSuccess?.();
        } catch {
            this._onError?.();
        } finally {
            saveBtn.disabled = false;
        }
    }
}