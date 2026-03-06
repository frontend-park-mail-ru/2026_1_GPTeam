import { BasePage } from "../base_page.js";
import { AuthForm } from "../../components/AuthForm/auth_form.js";

export class SignupPage extends BasePage {
    async render(root) {
        root.innerHTML = `
      <div class="page">
        <main class="page__content"></main>
      </div>
    `;

        const form = new AuthForm({ mode: "signup" });
        form.render(root.querySelector(".page__content"));
        form._on(form.getElement(), "submit", async (e) => form.submit(e));
        form._on(form.getElement().querySelector(".eye_btn"), "click", async (e) => form.show_password(e));
        form._on(form.getElement().querySelector(".confirm_eye_btn"), "click", async (e) => form.show_password(e));
        form._on(form.getElement().querySelector(".help_abc"), "mouseenter", async () => form.show_help_abc());
        form._on(form.getElement().querySelector(".help_abc"), "mouseleave", async () => form.hide_help_abc());
        this._components.push(form);
    }
}
