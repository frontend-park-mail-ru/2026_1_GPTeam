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

        const form = new LoginForm({
            mode: "login",
        });
        form.render(root.querySelector(".page__content"));
        form._on(form.getElement(), "submit", async (e) => form.login(e));
        this._components.push(form);
    }
}
