import { BasePage } from "../base_page.ts"; // Проверь пути
import template from "./appeal_detail.hbs?raw";
import Handlebars from "handlebars";
import { get_appeal_by_id } from "../../api/appeal.ts";
import "./appeal_detail.scss";

export class AppealDetailPage extends BasePage {
    private _appealId: string;

    // Роутер будет передавать нам параметры из URL (например: { id: "1045" })
    constructor(params: Record<string, string>) {
        super();
        this._appealId = params.id;
    }

    async render(root: HTMLElement): Promise<void> {
        await super.render(root);

        // Показываем загрузку, пока ждем данные
        root.innerHTML = `<div style="padding: 40px; color: #fff; text-align: center;">Загрузка обращения #${this._appealId}...</div>`;

        try {
            const data = await get_appeal_by_id(this._appealId);
            
            if (!data) {
                root.innerHTML = `<div style="padding: 40px; color: #ff4848; text-align: center;">Обращение не найдено</div>`;
                return;
            }

            const compiledTemplate = Handlebars.compile(template);
            root.innerHTML = compiledTemplate(data);

            // Кнопка "Назад"
            const backBtn = root.querySelector<HTMLElement>(".js--appeal-detail-back");
            if (backBtn) {
                backBtn.addEventListener("click", () => {
                    window.history.back(); // Возвращаемся в список
                });
            }
        } catch (error) {
            console.error("Ошибка при загрузке обращения:", error);
            root.innerHTML = `<div style="padding: 40px; color: #ff4848; text-align: center;">Ошибка сервера</div>`;
        }
    }
}