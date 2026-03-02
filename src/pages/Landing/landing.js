import { BasePage } from "../base_page.js";
import template from "./landing.hbs?raw";
import "./landing.css";

export class LandingPage extends BasePage {
    async render(root) {
        root.innerHTML = template;
    }
}