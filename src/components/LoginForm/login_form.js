import {BaseComponent} from "../base_component.js";
import template from "./login_form.hbs?raw";
import "./login_form.css"
import "../../utils/helpers.js"
import {validate_username, validate_password} from "../../utils/validation.js";

export class LoginForm extends BaseComponent {
    constructor(props) {
        super(template, props);
        this.mode = props.mode;
    }

    validate(username, password, error_message) {
        let errors = false;
        error_message.innerText = "";
        username.style.borderColor = "#484FFF";
        password.style.borderColor = "#484FFF";
        let [ok, error] = validate_username(username.value);
        if (!ok) {
            errors = true;
            username.style.borderColor = "red";
            error_message.innerText = error;
        }
        [ok, error] = validate_password(password.value);
        if (!ok) {
            errors = true;
            password.style.borderColor = "red";
            error_message.innerText = error;
        }
        return errors;
    }

    async login(e) {
        e.preventDefault();
        let submit_input = document.querySelector("input[type='submit']");
        let username = document.getElementById("username_input");
        let password = document.getElementById("password_input");
        let error_message = document.getElementById("error_message");

        let errors = this.validate(username, password, error_message);
        if (errors) return;

        submit_input.disabled = true;
        let response = await fetch("http://localhost:8080/auth/login", {
            credentials: "include",
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
                error_message.innerText = data["message"];
            }
        }
        submit_input.disabled = false;
    }
}
