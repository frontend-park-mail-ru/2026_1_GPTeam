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

        username.style.borderColor = "#484FFF";
        password.style.borderColor = "#484FFF";
        if (confirm_password) confirm_password.style.borderColor = "#484FFF";
        if (email) email.style.borderColor = "#484FFF";

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

        const submit_input = this.getElement().querySelector("input[type='submit']");
        const username = this.getElement().querySelector("#username_input");
        const password = this.getElement().querySelector("#password_input");
        const confirm_password = this.getElement().querySelector("#confirm_password_input");
        const email = this.getElement().querySelector("#email_input");
        const error_message = this.getElement().querySelector("#error_message");

        const errors = this.validate({ username, password, confirm_password, email }, error_message);
        if (errors) return;

        const isLogin = this.mode === "login";
        const url = isLogin
            ? "http://localhost:8080/auth/login"
            : "http://localhost:8080/signup";

        const fetchOptions = isLogin
            ? { credentials: "include" }
            : {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username.value,
                    password: password.value,
                    email: email.value,
                }),
            };

        submit_input.disabled = true;
        const response = await fetch(url, fetchOptions);
        const data = await response.json();

        if (data["code"] === 200) {
            window.location.href = "/";
        } else if (data["code"] === 500) {
            error_message.innerText = data["message"];
        } else {
            for (const [_, error] of Object.entries(data["errors"])) {
                if (error["field"] === "username") username.style.borderColor = "red";
                else if (error["field"] === "password") password.style.borderColor = "red";
                else if (error["field"] === "confirm_password" && confirm_password) confirm_password.style.borderColor = "red";
                else if (error["field"] === "email" && email) email.style.borderColor = "red";
            }
            error_message.innerText = data["message"];
        }

        submit_input.disabled = false;
    }
}