import {BasePage} from "../base_page.js";
import {Header} from "../../components/Header/header.js";
import {is_login} from "../../api/auth.js";
import template from "./profile.hbs?raw";
import {router} from "../../main.js";


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
            router.navigate("/login");
            return;
        }

        const header = new Header({
            cur_page: "/profile",
        });
        header.render(root.querySelector(".page__header"));
        this._components.push(header);
    }
}