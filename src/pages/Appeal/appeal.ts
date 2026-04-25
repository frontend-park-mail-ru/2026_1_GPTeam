import { BasePage } from "../base_page.ts";
import template from "./appeal.hbs?raw";
import Handlebars from "handlebars";
import { router } from "../../router/router_instance.ts";
import { AppealCard } from "../../components/AppealCard/appeal_card.ts";
import { get_appeals } from "../../api/appeal.ts"; // ИМПОРТ НАШЕГО API
import "./appeal.scss";

export class AppealPage extends BasePage {
    async render(root: HTMLElement): Promise<void> {
        await super.render(root);

        const compiledTemplate = Handlebars.compile(template);
        root.innerHTML = compiledTemplate({});

        // Обработка кнопки "Назад" (теперь она красивая овальная)
        const backBtn = root.querySelector<HTMLElement>(".js--appeal-back");
        if (backBtn) {
            backBtn.addEventListener("click", () => {
                // Возвращает на ту страницу, с которой ты пришел (например, профиль или лендинг)
                window.history.back(); 
            });
        }

        const listContainer = root.querySelector<HTMLElement>(".js--appeal-list");
        const emptyContainer = root.querySelector<HTMLElement>(".js--appeal-empty");
        
        if (listContainer && emptyContainer) {
            // 1. Показываем загрузку (опционально)
            listContainer.innerHTML = "<p style='color: #666;'>Загрузка обращений...</p>";

            try {
                // 2. Делаем запрос к API
                const appeals = await get_appeals();
                
                // Очищаем текст загрузки
                listContainer.innerHTML = "";

                // 3. Проверяем, есть ли данные
                if (appeals.length === 0) {
                    // ЕСЛИ ПУСТО: Показываем блок "Нет обращений"
                    listContainer.style.display = "none";
                    emptyContainer.style.display = "flex";
                } else {
                    // ЕСЛИ ЕСТЬ ДАННЫЕ: Рендерим карточки
                    emptyContainer.style.display = "none";
                    listContainer.style.display = "flex";

                    appeals.forEach(appealData => {
                        const card = new AppealCard(appealData);
                        card.render(listContainer);
                        this._components.push(card); // Сохраняем для корректного destroy
                    });
                }
            } catch (error) {
                console.error("Ошибка загрузки обращений:", error);
                listContainer.innerHTML = "<p style='color: #ff4848;'>Не удалось загрузить данные.</p>";
            }
        }
    }
}