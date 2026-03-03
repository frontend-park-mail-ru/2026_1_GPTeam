import {BaseComponent} from "../base_component.js";
import template from "./auth_form.hbs?raw";
import "./auth_form.css"
import "../../utils/helpers.js"
import {is_empty, validate_username, validate_password, are_password_equal} from "../../utils/validation.js";
import {client} from "../../api/client.js";

export class AuthForm extends BaseComponent {
    constructor(props) {
        super(template, props);
        this.mode = props.mode;
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
            input.classList.add("valid");
            input.classList.remove("invalid");
        }

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
            if (!ok)
                mark_invalid(field, error);
            else
                mark_valid(field);
        }

        let [ok, error] = validate_username(username.value);
        if (!ok)
            mark_invalid(username, error);
        else
            mark_valid(username);

        [ok, error] = validate_password(password.value);
        if (!ok)
            mark_invalid(password, error);
        else
            mark_valid(password);

        if (this.mode === "signup" && confirm_password) {
            [ok, error] = are_password_equal(password.value, confirm_password.value);
            if (!ok)
                mark_invalid(confirm_password, error);
            else
                mark_valid(confirm_password);
        }

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
            ? "/auth/login"
            : "/signup";

        const request_data = {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        };
        if (isLogin)
            request_data.body = JSON.stringify({
                username: username.value,
                password: password.value,
            });
        else
            request_data.body = JSON.stringify({
                username: username.value,
                password: password.value,
                email: email.value,
            });

        submit_input.disabled = true;
        const response = await client(url, request_data);
        const data = await response.json();

        if (data["code"] === 200) {
            window.location.href = "/";
        }
        else if (data["code"] === 500) {
            error_message.innerText = data["message"];
        }
        else if (data["code"] === 405) {
            console.log(data["message"]);
        }
        else {
            const mark_invalid = (input) => {
                input.classList.add("invalid");
                input.classList.remove("valid");
            }

            for (const [_, error] of Object.entries(data["errors"])) {
                if (error["field"] === "username") mark_invalid(username);
                else if (error["field"] === "password") mark_invalid(password);
                else if (error["field"] === "confirm_password" && confirm_password) mark_invalid(confirm_password);
                else if (error["field"] === "email" && email) mark_invalid(email);
            }
            error_message.innerText = data["message"];
        }
        submit_input.disabled = false;
    }
}