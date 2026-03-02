import { BasePage } from "../base_page.js";
import { Header } from "../../components/Header/header.js";

export class IndexPage extends BasePage {
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
    }
}
