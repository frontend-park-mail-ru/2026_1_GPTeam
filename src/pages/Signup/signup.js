import { BasePage } from "../base_page.js";
import {SignupForm} from "../../components/SignupForm/signup_form.js";

export class SignupPage extends BasePage {
    async render(root) {
        root.innerHTML = `
      <div class="page">
        <main class="page__content">
            
        </main>
      </div>
    `;

        const form = new SignupForm({
            mode: "signup",
        });
        form.render(root.querySelector(".page__content"));
        form._on(form.getElement(), "submit", async (e) => form.signup(e));
        this._components.push(form);
    }
}
