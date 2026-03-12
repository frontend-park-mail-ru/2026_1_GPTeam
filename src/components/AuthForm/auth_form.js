import {BaseComponent} from "../base_component.js";
import template from "./auth_form.hbs?raw";
import "./auth_form.css"
import "../../utils/helpers.js"
import {is_empty, validate_username, validate_password, are_password_equal, validate_email} from "../../utils/validation.js";
import {client} from "../../api/client.js";
import { router } from "../../router/router_instance.js";

/**
 * Компонент формы авторизации и регистрации.
 * Управляет состоянием полей, валидацией на стороне клиента и отправкой данных на сервер.
 * @class AuthForm
 * @extends BaseComponent
 */
export class AuthForm extends BaseComponent {
    /**
     * Создает экземпляр формы.
     * @param {Object} props - Свойства компонента.
     * @param {"login"|"signup"} props.mode - Режим работы формы: авторизация или регистрация.
     */
    constructor(props) {
        super(template, props);
        this.mode = props.mode;
    }

    /**
     * Устанавливает обработчики событий для элементов формы.
     * Включает переключение видимости пароля и подсказки (tooltip).
     * @private
     */
    _addEventListeners() {
        const form = this.getElement();
        const eye_btn = form.querySelector(".eye_btn");
        const confirm_eye_btn = form.querySelector(".confirm_eye_btn");
        const help_abc = form.querySelector(".help_abc");
        const help_abc_text = form.querySelector("#help_abc_text");
        const password = form.querySelector("#password_input");
        const confirm_password = form.querySelector("#confirm_password_input");

        if (eye_btn) {
            this._on(eye_btn, "click", () => {
                const isVisible = password.type === "text";
                password.type = isVisible ? "password" : "text";
                eye_btn.src = isVisible ? "/img/closed_eye.png" : "/img/opened_eye.png";
            });
        }

        if (confirm_eye_btn && confirm_password) {
            this._on(confirm_eye_btn, "click", () => {
                const isVisible = confirm_password.type === "text";
                confirm_password.type = isVisible ? "password" : "text";
                confirm_eye_btn.src = isVisible ? "/img/closed_eye.png" : "/img/opened_eye.png";
            });
        }

        if (help_abc && help_abc_text) {
            this._on(help_abc, "mouseover", () => {
                help_abc_text.style.visibility = "visible";
            });
            this._on(help_abc, "mouseout", () => {
                help_abc_text.style.visibility = "hidden";
            });
        }
    }

    /**
     * Выполняет валидацию полей формы.
     * Проверяет на пустоту, корректность логина/пароля, совпадение паролей и email в режиме signup.
     * @param {Object} fields - Объект с DOM-элементами полей.
     * @param {HTMLElement} error_message - Элемент для вывода текста ошибки.
     * @returns {boolean} Возвращает true, если найдены ошибки, иначе false.
     */
    validate(fields, error_message) {
        const { username, password, confirm_password, email } = fields;
        let errors = false;

        const mark_invalid = (input, error) => {
            errors = true;
            error_message.innerText = error;
            input.classList.add("invalid");
            input.classList.remove("valid");
        };
        const mark_valid = (input) => {
            input.classList.remove("invalid");
        };

        const allFields = [username, password, confirm_password, email].filter(f => f);
        allFields.forEach(f => f.style.borderColor = "#484FFF");

        const requiredFields = [
            [username, "Имя"],
            [password, "Пароль"],
            ...(this.mode === "signup" ? [
                [confirm_password, "Подтверждение пароля"],
                [email, "Email"],
            ] : []),
        ];

        for (const [field, name] of requiredFields) {
            mark_valid(field);
            const [ok, error] = is_empty(field.value, name);
            if (!ok)
                mark_invalid(field, error);
        }

        let [ok, error] = validate_username(username.value);
        if (!ok)
            mark_invalid(username, error);

        [ok, error] = validate_password(password.value);
        if (!ok)
            mark_invalid(password, error);

        if (this.mode === "signup" && confirm_password) {
            [ok, error] = are_password_equal(password.value, confirm_password.value);
            if (!ok)
                mark_invalid(confirm_password, error);

            [ok, error] = validate_email(email.value);
            if (!ok)
                mark_invalid(email, error);
        }

        if (this.mode === "signup" && email) {
            [ok, error] = validate_email(email.value);
            if (!ok)
                mark_invalid(email, error);
        }

        return errors;
    }

    /**
     * Обработчик отправки формы.
     * Предотвращает стандартное поведение, вызывает валидацию и отправляет данные на сервер.
     * При успехе перенаправляет пользователя на страницу профиля.
     * @async
     * @param {Event} e - Объект события submit.
     * @returns {Promise<void>}
     */
    async submit(e) {
        e.preventDefault();

        const form = this.getElement();
        const submit_btn = form.querySelector("button[type='submit']");
        const username = form.querySelector("#username_input");
        const password = form.querySelector("#password_input");
        const confirm_password = form.querySelector("#confirm_password_input");
        const email = form.querySelector("#email_input");
        const error_message = form.querySelector("#error_message");

        const hasErrors = this.validate({ username, password, confirm_password, email }, error_message);
        if (hasErrors) return;

        const isLogin = this.mode === "login";
        const url = isLogin ? "/auth/login" : "/auth/signup";

        const payload = {
            username: username.value,
            password: password.value,
        };

        if (!isLogin) {
            payload.email = email.value;
            payload.confirm_password = confirm_password.value;
        }

        const fetchOptions = {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
        };

        submit_btn.disabled = true;

        try {
            const response = await client(url, fetchOptions);
            const data = await response.json();

            if (data.code === 200) {
                router.navigate("/profile");
            } else if (data.code === 405) {
                console.error(data["message"]);
            } else {
                const mark_invalid = (input) => {
                    input.classList.add("invalid");
                    input.classList.remove("valid");
                };

                if (data.errors && Array.isArray(data.errors)) {
                    data.errors.forEach(err => {
                        if (err.field === "username") mark_invalid(username);
                        if (err.field === "password") mark_invalid(password);
                        if (err.field === "confirm_password") mark_invalid(confirm_password);
                        if (err.field === "email") mark_invalid(email);
                    });
                }
                error_message.innerText = data.message || "Произошла ошибка";
            }
        } catch (err) {
            console.error("Fetch error:", err);
            error_message.innerText = "Сервер недоступен";
        } finally {
            submit_btn.disabled = false;
        }
    }
}
