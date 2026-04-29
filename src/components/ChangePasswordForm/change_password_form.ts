import { BaseComponent } from "../base_component.ts";
import template from "./change_password_form.hbs?raw";
import "./change_password_form.scss";
import {
    is_empty,
    validate_password,
    are_password_equal,
} from "../../utils/validation.ts";
import { router } from "../../router/router_instance.ts";
import { update_profile } from "../../api/profile.ts";
import {clean_data} from "../../utils/xss.ts";

interface ChangePasswordFormProps extends Record<string, unknown> {
    onSuccess?: () => void;
    onError?: () => void;
}

/**
 * Компонент формы смены пароля.
 * Валидирует текущий пароль, новый пароль и подтверждение.
 * Вызывает onSuccess/onError колбэки после отправки.
 *
 * @class ChangePasswordForm
 * @extends BaseComponent
 */
export class ChangePasswordForm extends BaseComponent {
    private _onSuccess?: () => void;
    private _onError?: () => void;

    constructor(props: ChangePasswordFormProps) {
        super(template, props);
        this._onSuccess = props.onSuccess;
        this._onError = props.onError;
    }

    protected _addEventListeners(): void {
        const form = this.getElement();
        if (!form) return;

        const cancelBtn = form.querySelector<HTMLElement>("#change-password-cancel-btn");
        if (cancelBtn) {
            this._on(cancelBtn, "click", () => router.navigate("/profile"));
        }

        this._bindEye(form, "#change-password-current", "#eye-current");
        this._bindEye(form, "#change-password-new", "#eye-new");
        this._bindEye(form, "#change-password-confirm", "#eye-confirm");

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
     * Валидирует поля формы смены пароля.
     *
     * @private
     * @param {{ currentPassword: HTMLInputElement; newPassword: HTMLInputElement; confirmPassword: HTMLInputElement }} fields
     * @param {HTMLElement} errorEl
     * @returns {boolean} true если есть ошибки
     */
    private _validate(
        fields: {
            currentPassword: HTMLInputElement;
            newPassword: HTMLInputElement;
            confirmPassword: HTMLInputElement;
        },
        errorEl: HTMLElement
    ): boolean {
        Object.entries(fields).forEach(([_, value]) => {
            if (value) {
                value.value = clean_data(value.value);
            }
        });
        const { currentPassword, newPassword, confirmPassword } = fields;
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

        [currentPassword, newPassword, confirmPassword].forEach(markValid);

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

        return hasErrors;
    }

    /**
     * Обработчик отправки формы смены пароля.
     *
     * @async
     * @param {SubmitEvent} e
     * @returns {Promise<void>}
     */
    async submit(e: SubmitEvent): Promise<void> {
        e.preventDefault();

        const form = this.getElement();
        if (!form) return;

        const currentPasswordInput = form.querySelector<HTMLInputElement>("#change-password-current")!;
        const newPasswordInput = form.querySelector<HTMLInputElement>("#change-password-new")!;
        const confirmPasswordInput = form.querySelector<HTMLInputElement>("#change-password-confirm")!;
        const errorEl = form.querySelector<HTMLElement>("#change-password-error")!;
        const saveBtn = form.querySelector<HTMLButtonElement>(".change-password__btn-save")!;

        const hasErrors = this._validate(
            {
                currentPassword: currentPasswordInput,
                newPassword: newPasswordInput,
                confirmPassword: confirmPasswordInput,
            },
            errorEl
        );

        if (hasErrors) return;

        saveBtn.disabled = true;

        try {
            const result = await update_profile({
                password: newPasswordInput.value,
                current_password: currentPasswordInput.value,
            });
            if (result.code === 200) {
                this._onSuccess?.();
            } else {
                errorEl.innerText = result.message || "Не удалось изменить пароль";
                this._onError?.();
            }
        } catch {
            errorEl.innerText = "Ошибка сети при изменении пароля";
            this._onError?.();
        } finally {
            saveBtn.disabled = false;
        }
    }
}
