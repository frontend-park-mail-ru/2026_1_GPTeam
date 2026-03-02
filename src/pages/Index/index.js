import { BasePage } from "../base_page.js";
import template from "./index.hbs?raw";
import "./index.css";

export class IndexPage extends BasePage {
    async render(root) {
        root.innerHTML = template;
    }
}