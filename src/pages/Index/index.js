import { BasePage } from "../base_page.js";
import { Header } from "../../components/Header/header.js";
import { is_login } from "../../api/auth.js";

export class IndexPage extends BasePage {
    async render(root) {
        let data = await is_login("/");

        root.innerHTML = `
      <div class="page">
        <header class="page__header"></header>
        <main class="page__content">
            <p>is_auth: ${data["is_auth"]}</p>
            <p>user_id: ${data["user_id"]}</p>
        </main>
      </div>
    `;

        const header = new Header({});
        header.render(root.querySelector(".page__header"));
        this._components.push(header);
    }
}
