import { BasePage } from "../base_page.js";
import {LoginForm} from "../../components/LoginForm/login_form.js";

export class LoginPage extends BasePage {
    async render(root) {
        root.innerHTML = `
      <div class="page">
        <main class="page__content">
            
        </main>
      </div>
    `;

        const form = new LoginForm({});
        form.render(root.querySelector(".page__content"));
        form._on(form.getElement(), "submit", async (e) => {
            e.preventDefault();
            let submit_input = document.querySelector("input[type='submit']");
            let username = document.getElementById("username_input");
            let password = document.getElementById("password_input");
            let error_message = document.getElementById("error_message");
            let errors = false;
            if (!username.value) {
                errors = true;
                error_message.innerText = "Имя пустое";
            }
            if (!password.value) {
                errors = true;
                error_message.innerText = "Пароль пустой";
            }
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

        })
        this._components.push(form);
    }
}
