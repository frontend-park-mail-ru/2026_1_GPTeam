import {BaseComponent} from "../base_component.js";
import template from "./login_form.hbs?raw";
import "./login_form.css"
import "../../utils/helpers.js"
import {validate_username, validate_password} from "../../utils/validation.js";
import {client} from "../../api/client.js";

export class LoginForm extends BaseComponent {
    constructor(props) {
        super(template, props);
        this.mode = props.mode;
    }

    validate(inputs, error_message) {
        let errors = false;
        error_message.innerText = "";

        const mark_invalid = (input) => {
            errors = true;
            error_message.innerText = error;
            input.classList.add("invalid");
            input.classList.remove("valid");
        };
        const mark_valid = (input) => {
            input.classList.add("valid");
            input.classList.remove("invalid");
        }

        let [ok, error] = validate_username(inputs["username"].value);
        if (!ok)
            mark_invalid(inputs["username"]);
        else
            mark_valid(inputs["username"]);
        [ok, error] = validate_password(inputs["password"].value);
        if (!ok)
            mark_invalid(inputs["password"]);
        else
            mark_valid(inputs["password"]);
        return errors;
    }

    async login(e) {
        e.preventDefault();
        let submit_input = document.querySelector("input[type='submit']");
        let username = document.getElementById("username_input");
        let password = document.getElementById("password_input");
        let error_message = document.getElementById("error_message");
        let inputs = {
            "username": username,
            "password": password,
        }

        let errors = this.validate(inputs, error_message);
        if (errors) return;

        submit_input.disabled = true;
        let response = await client("/auth/login", {
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
                inputs[error["field"]].classList.add("invalid");
                inputs[error["field"]].classList.remove("valid");
                error_message.innerText = data["message"];
            }
        }
        submit_input.disabled = false;
    }
}
