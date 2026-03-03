import {BasePage} from "../base_page.js";
import {Header} from "../../components/Header/header.js";
import {is_login} from "../../api/auth.js";
import template from "./profile.hbs?raw";

export class ProfilePage extends BasePage {
    async render(root) {
        root.innerHTML = `
      <div class="page">
        <header class="page__header"></header>
        <main class="page__content">${template}</main>
      </div>
    `;

        let data = await is_login();
        if (data["code"] !== 200) {
            window.location.href = "/login";
            return;
        }

        const header = new Header({});
        header.render(root.querySelector(".page__header"));
        this._components.push(header);
    }
}