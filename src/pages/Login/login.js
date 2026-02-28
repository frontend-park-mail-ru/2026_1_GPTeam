import { BasePage } from "../base_page.js";
import { Header } from "../../components/Header/header.js";
import {LoginForm} from "../../components/LoginForm/login_form.js";

export class LoginPage extends BasePage {
    async render(root) {
        root.innerHTML = `
      <div class="page">
        <header class="page__header"></header>
        <main class="page__content">
            
        </main>
      </div>
    `;

        const header = new Header({});
        header.render(root.querySelector(".page__header"));
        this._components.push(header);

        const form = new LoginForm({});
        form.render(root.querySelector(".page__content"));
        form._on(form.getElement(), "submit", async (e) => {
            e.preventDefault();
            let username = document.getElementById("username_input");
            let password = document.getElementById("password_input");
            let username_error = document.getElementById("username_error");
            let password_error = document.getElementById("password_error");
            let errors = false;
            if (!username.value) {
                errors = true;
                username_error.innerText = "empty";
                username_error.style.display = "block";
            }
            if (!password.value) {
                errors = true;
                password_error.innerText = "empty";
                password_error.style.display = "block";
            }
            if (errors) return;
            let response = await fetch("http://localhost:8080/auth/login", {
                credentials: "include",
            })
            console.log(await response.json())
            username.value = "";
            password.value = "";
            username_error.style.display = "none";
            password_error.style.display = "none";
        })
        this._components.push(form);
    }
}
