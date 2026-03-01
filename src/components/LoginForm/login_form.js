import {BaseComponent} from "../base_component.js";
import template from "./login_form.hbs?raw";
import "./login_form.css"
import Handlebars from "handlebars";

export class LoginForm extends BaseComponent {
    constructor(props) {
        super(template, props);
        Handlebars.registerHelper("equal", function (a, b, options) {
            return (a === b) ? options.fn(this) : options.inverse(this);
        })
    }

    validate(username, password, error_message) {
        let errors = false;
        error_message.innerText = "";
        username.style.borderColor = "#484FFF";
        password.style.borderColor = "#484FFF";
        if (!username.value) {
            errors = true;
            username.style.borderColor = "red";
            error_message.innerText = "Имя пустое";
        }
        if (!password.value) {
            errors = true;
            password.style.borderColor = "red";
            error_message.innerText = "Пароль пустой";
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
