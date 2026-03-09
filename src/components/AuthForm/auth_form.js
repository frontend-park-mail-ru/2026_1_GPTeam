import {BaseComponent} from "../base_component.js";
import template from "./auth_form.hbs?raw";
import "./auth_form.css"
import "../../utils/helpers.js"
import {is_empty, validate_username, validate_password, are_password_equal, validate_email} from "../../utils/validation.js";
import {client} from "../../api/client.js";
import { router } from "../../router/router_instance.js";

export class AuthForm extends BaseComponent {
    constructor(props) {
        super(template, props);
        this.mode = props.mode;
    }

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

        return errors;
    }

    async submit(e) {
        e.preventDefault();

        const form = this.getElement();
        const submit_input = form.querySelector("input[type='submit']");
        const username = form.querySelector("#username_input");
        const password = form.querySelector("#password_input");
        const confirm_password = form.querySelector("#confirm_password_input");
        const email = form.querySelector("#email_input");
        const error_message = form.querySelector("#error_message");

        const hasErrors = this.validate({ username, password, confirm_password, email }, error_message);
        if (hasErrors) return;

        const isLogin = this.mode === "login";
        const url = isLogin ? "/auth/login" : "/signup";

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

        submit_input.disabled = true;

        try {
            const response = await client(url, fetchOptions);
            const data = await response.json();

            if (data.code === 200) {
                router.navigate("/balance");
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
            submit_input.disabled = false;
        }
    }
}