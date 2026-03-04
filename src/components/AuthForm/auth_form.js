import {BaseComponent} from "../base_component.js";
import template from "./auth_form.hbs?raw";
import "./auth_form.css"
import "../../utils/helpers.js"
import {is_empty, validate_username, validate_password, are_password_equal} from "../../utils/validation.js";

export class AuthForm extends BaseComponent {
    constructor(props) {
        super(template, props);
        this.mode = props.mode;
    }

    validate(fields, error_message) {
        const { username, password, confirm_password, email } = fields;
        let errors = false;
        let errorText = "";

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
            const [ok, error] = is_empty(field.value, name);
            if (!ok) {
                errors = true;
                field.style.borderColor = "red";
                if (!errorText) errorText = error;
            }
        }

        let [ok, error] = validate_username(username.value);
        if (!ok) {
            errors = true;
            username.style.borderColor = "red";
            if (!errorText) errorText = error;
        }

        [ok, error] = validate_password(password.value);
        if (!ok) {
            errors = true;
            password.style.borderColor = "red";
            if (!errorText) errorText = error;
        }

        if (this.mode === "signup" && confirm_password) {
            [ok, error] = are_password_equal(password.value, confirm_password.value);
            if (!ok) {
                errors = true;
                confirm_password.style.borderColor = "red";
                if (!errorText) errorText = error;
            }
        }

        error_message.innerText = errorText;
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
        const url = isLogin
            ? "http://localhost:8080/auth/login"
            : "http://localhost:8080/signup";

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
            const response = await fetch(url, fetchOptions);
            const data = await response.json();

            if (data.code === 200) {
                window.location.href = "/budget"; //экспериментально перенаправляем на бюджет, т.к. после логина/регистрации обычно хотят попасть в приложение
            } else {
                if (data.errors && Array.isArray(data.errors)) {
                    data.errors.forEach(err => {
                        if (err.field === "username") username.style.borderColor = "red";
                        if (err.field === "password") password.style.borderColor = "red";
                        if (err.field === "confirm_password") confirm_password.style.borderColor = "red";
                        if (err.field === "email") email.style.borderColor = "red";
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