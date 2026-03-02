import {BaseComponent} from "../base_component.js";
import template from "./signup_form.hbs?raw";
import "./signup_form.css"
import "../../utils/helpers.js"
import {validate_username, validate_password, are_password_equal, is_empty} from "../../utils/validation.js";

export class SignupForm extends BaseComponent {
    constructor(props) {
        super(template, props);
        this.mode = props.mode;
    }

    validate(username, password, confirm_password, email, error_message) {
        let errors = false;
        let errorText = "";
        
        username.style.borderColor = "#484FFF";
        password.style.borderColor = "#484FFF";
        confirm_password.style.borderColor = "#484FFF";
        email.style.borderColor = "#484FFF";

        const fields = [
            [username, "Имя"],
            [password, "Пароль"],
            [confirm_password, "Подтверждение пароля"],
            [email, "Email"],
        ];
        for (const [field, name] of fields) {
            let [ok, error] = is_empty(field.value, name);
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
        [ok, error] = are_password_equal(password.value, confirm_password.value);
        if (!ok) {
            errors = true;
            confirm_password.style.borderColor = "red";
            if (!errorText) errorText = error;
        }

        error_message.innerText = errorText;
        return errors;
    }

    async signup(e) {
        e.preventDefault();
        let submit_input = document.querySelector("input[type='submit']");
        let username = document.getElementById("username_input");
        let password = document.getElementById("password_input");
        let confirm_password = document.getElementById("confirm_password_input");
        let email = document.getElementById("email_input");
        let error_message = document.getElementById("error_message");

        let errors = this.validate(username, password, confirm_password, email, error_message);
        if (errors) return;

        submit_input.disabled = true;
        let response = await fetch("http://localhost:8080/signup", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username.value,
                password: password.value,
                confirm_password: confirm_password.value,
                email: email.value,
            })
        })
        let data = await response.json();

        if (data["code"] === 200) {
            window.location.href = "/";
        }
        else if (data["code"] === 500) {
            error_message.innerText = data["message"];
        }
        else {
            for (const [_, error] of Object.entries(data["errors"])) {
                if (error["field"] === "username") {
                    username.style.borderColor = "red";
                }
                else if (error["field"] === "password") {
                    password.style.borderColor = "red";
                }
                else if (error["field"] === "confirm_password") {
                    confirm_password.style.borderColor = "red";
                }
                error_message.innerText = data["message"];
            }
        }
        submit_input.disabled = false;
    }
}