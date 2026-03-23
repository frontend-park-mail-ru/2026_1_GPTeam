import { BaseComponent } from "../base_component.ts";
import template from "./auth_form.hbs?raw";
import "./auth_form.css";
import "../../utils/helpers.ts";
import { is_empty, validate_username, validate_password, are_password_equal, validate_email } from "../../utils/validation.ts";
import { client } from "../../api/client.ts";
import { router } from "../../router/router_instance.ts";
import { is_login } from "../../api/auth.ts";
import type { AuthResponse as AuthResponseType } from "../../types/interfaces.ts";

interface AuthFormProps {
    mode: "login" | "signup";
    [key: string]: unknown;
}

/**
 * Компонент формы авторизации и регистрации.
 * @class AuthForm
 * @extends BaseComponent
 */
export class AuthForm extends BaseComponent {
    private mode: "login" | "signup";

    /**
     * @param {AuthFormProps} props
     */
    constructor(props: AuthFormProps) {
        super(template, props);
        this.mode = props.mode;
        this._checkAuth();
    }

    /**
     * Проверяет авторизацию и редиректит если уже залогинен.
     * @private
     */
    private async _checkAuth(): Promise<void> {
        try {
            const isLoggedIn = await is_login();
            if (isLoggedIn) router.navigate("/balance");
        } catch (err) {
            console.error("Ошибка при проверке авторизации:", err);
        }
    }

    /**
     * @protected
     */
    protected _addEventListeners(): void {
        const form = this.getElement();
        if (!form) return;
        const eye_btn = form.querySelector<HTMLImageElement>(".eye_btn");
        const confirm_eye_btn = form.querySelector<HTMLImageElement>(".confirm_eye_btn");
        const password = form.querySelector<HTMLInputElement>("#password_input");
        const confirm_password = form.querySelector<HTMLInputElement>("#confirm_password_input");

        if (eye_btn && password) {
            this._on(eye_btn, "click", () => {
                const isVisible = password.type === "text";
                password.type = isVisible ? "password" : "text";
                eye_btn.src = isVisible ? "/icons/closed_eye.svg" : "/icons/opened_eye.svg";
            });
        }
        if (confirm_eye_btn && confirm_password) {
            this._on(confirm_eye_btn, "click", () => {
                const isVisible = confirm_password.type === "text";
                confirm_password.type = isVisible ? "password" : "text";
                confirm_eye_btn.src = isVisible ? "/icons/closed_eye.svg" : "/icons/opened_eye.svg";
            });
        }
    }

    /**
     * Валидирует поля формы, показывает первую найденную ошибку.
     * @param {{ username: HTMLInputElement | null, password: HTMLInputElement | null, confirm_password: HTMLInputElement | null, email: HTMLInputElement | null }} fields
     * @param {HTMLElement} error_message
     * @returns {boolean}
     */
    validate(
        fields: {
            username: HTMLInputElement | null;
            password: HTMLInputElement | null;
            confirm_password: HTMLInputElement | null;
            email: HTMLInputElement | null;
        },
        error_message: HTMLElement
    ): boolean {
        const { username, password, confirm_password, email } = fields;
        let firstError = "";
        error_message.innerText = "";

        const allFields = [username, password, confirm_password, email].filter((f): f is HTMLInputElement => f !== null);
        allFields.forEach(f => {
            f.style.borderColor = "#484FFF";
            f.classList.remove("invalid");
        });

        const markInvalid = (input: HTMLInputElement, error: string): void => {
            input.classList.add("invalid");
            input.classList.remove("valid");
            if (!firstError) firstError = error;
        };

        const requiredFields: [HTMLInputElement, string][] = [
            [username!, "Логин"],
            [password!, "Пароль"],
            ...(this.mode === "signup" ? [
                [confirm_password!, "Подтверждение пароля"],
                [email!, "Email"],
            ] as [HTMLInputElement, string][] : []),
        ];

        for (const [field, name] of requiredFields) {
            const [ok, error] = is_empty(field.value, name);
            if (!ok) markInvalid(field, error);
        }

        if (this.mode === "signup") {
            if (username!.value) {
                const [ok, error] = validate_username(username!.value);
                if (!ok) markInvalid(username!, error);
            }
            if (password!.value) {
                const [ok, error] = validate_password(password!.value);
                if (!ok) markInvalid(password!, error);
            }
            if (password!.value && confirm_password!.value) {
                const [ok, error] = are_password_equal(password!.value, confirm_password!.value);
                if (!ok) markInvalid(confirm_password!, error);
            }
            if (email!.value) {
                const [ok, error] = validate_email(email!.value);
                if (!ok) markInvalid(email!, error);
            }
        }

        error_message.innerText = firstError;
        return firstError !== "";
    }

    /**
     * Обработчик отправки формы.
     * @async
     * @param {Event} e
     * @returns {Promise<void>}
     */
    async submit(e: Event): Promise<void> {
        e.preventDefault();
        const form = this.getElement();
        if (!form) return;
        const submit_btn = form.querySelector<HTMLButtonElement>("button[type='submit']");
        const username = form.querySelector<HTMLInputElement>("#username_input");
        const password = form.querySelector<HTMLInputElement>("#password_input");
        const confirm_password = form.querySelector<HTMLInputElement>("#confirm_password_input");
        const email = form.querySelector<HTMLInputElement>("#email_input");
        const error_message = form.querySelector<HTMLElement>("#error_message");
        if (!error_message) return;

        const hasErrors = this.validate({ username, password, confirm_password, email }, error_message);
        if (hasErrors) return;

        const isLogin = this.mode === "login";
        const url = isLogin ? "/auth/login" : "/auth/signup";
        const payload: Record<string, string> = {
            username: username!.value,
            password: password!.value,
        };
        if (!isLogin) {
            payload.email = email!.value;
            payload.confirm_password = confirm_password!.value;
        }

        if (submit_btn) submit_btn.disabled = true;
        try {
            const response = await client(url, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data: AuthResponseType = await response.json();
            if (data.code === 200) {
                router.navigate("/balance");
            } else if (data.code === 405) {
                console.error(data.message);
            } else {
                const markInvalid = (input: HTMLInputElement): void => {
                    input.classList.add("invalid");
                    input.classList.remove("valid");
                };
                if (data.errors && Array.isArray(data.errors)) {
                    data.errors.forEach(err => {
                        if (err.field === "username" && username) markInvalid(username);
                        if (err.field === "password" && password) markInvalid(password);
                        if (err.field === "confirm_password" && confirm_password) markInvalid(confirm_password);
                        if (err.field === "email" && email) markInvalid(email);
                    });
                }
                error_message.innerText = isLogin ? "Неверный логин или пароль" : (data.message ?? "Произошла ошибка");
            }
        } catch (err) {
            console.error("Fetch error:", err);
            error_message.innerText = "Сервер недоступен";
        } finally {
            if (submit_btn) submit_btn.disabled = false;
        }
    }
}