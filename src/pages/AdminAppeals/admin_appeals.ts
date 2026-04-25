import { BasePage } from "../base_page.ts";
import template from "./admin_appeals.hbs?raw";
import Handlebars from "handlebars";
import { router } from "../../router/router_instance.ts";
import { AppealCard } from "../../components/AppealCard/appeal_card.ts";
import { get_all_appeals } from "../../api/admin.ts";
import "./admin_appeals.scss";

export class AdminAppealsPage extends BasePage {
    async render(root: HTMLElement): Promise<void> {
        await super.render(root);

        const compiledTemplate = Handlebars.compile(template);
        root.innerHTML = compiledTemplate({});

        const backBtn = root.querySelector<HTMLElement>(".js--admin-back");
        if (backBtn) {
            backBtn.addEventListener("click", () => {
                window.history.back();
            });
        }

        const listContainer = root.querySelector<HTMLElement>(".js--admin-list");
        const emptyContainer = root.querySelector<HTMLElement>(".js--admin-empty");

        if (listContainer && emptyContainer) {
            listContainer.innerHTML = "<p style='color: #666;'>Загрузка обращений...</p>";

            try {
                const appeals = await get_all_appeals();
                listContainer.innerHTML = "";

                if (appeals.length === 0) {
                    listContainer.style.display = "none";
                    emptyContainer.style.display = "flex";
                } else {
                    emptyContainer.style.display = "none";
                    listContainer.style.display = "flex";

                    appeals.forEach(appealData => {
                        const card = new AppealCard(appealData);
                        card.render(listContainer);
                        this._components.push(card);
                    });
                }
            } catch (error) {
                console.error("Ошибка загрузки обращений:", error);
                listContainer.innerHTML = "<p style='color: #ff4848;'>Не удалось загрузить данные.</p>";
            }
        }
    }
}
