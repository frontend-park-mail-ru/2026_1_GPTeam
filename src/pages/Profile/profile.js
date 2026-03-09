import {BasePage} from "../base_page.js";
import {Header} from "../../components/Header/header.js";
import template from "./profile.hbs?raw";
import {router} from "../../router/router_instance.js";
import {get_profile} from "../../api/profile.js";
import {logout} from "../../api/auth.js";
import "./profile.css";


export class ProfilePage extends BasePage {
    async render(root) {
        root.innerHTML = `
      <div class="page">
        <header class="page__header"></header>
        <main class="page__content">${template}</main>
      </div>
    `;

        let data = await get_profile();
        if (data["code"] === 401) {
            router.navigate("/login");
            return;
        }

        const header = new Header({
            cur_page: "/profile",
        });
        header.render(root.querySelector(".page__header"));
        this._components.push(header);

        let logout_btn = document.querySelector(".logout_btn");
        logout_btn.addEventListener("click", async () => {
            let ok = await logout();
            if (ok) {
                router.navigate("/");
                return;
            }
            console.error("wrong tokens");
        });
    }
}