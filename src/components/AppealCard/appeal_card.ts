import { BaseComponent } from "../base_component.ts";
import template from "./appeal_card.hbs?raw";
import "./appeal_card.scss";
import type { AppealCardProps } from "../../types/interfaces.ts";
import { router } from "../../router/router_instance.ts"; // ДОБАВЬ ИМПОРТ РОУТЕРА

export class AppealCard extends BaseComponent {
    constructor(props: AppealCardProps) {
        super(template, props);
    }

    // Добавляем логику клика
    protected override _addEventListeners(): void {
        // Добавляем курсор-указатель (pointer) через стили JS или добавь в SCSS: cursor: pointer;
        const el = this.getElement();
        if (el) {
            el.style.cursor = "pointer";
        }

        // Слушаем клик по всей карточке
        this._delegate("click", ".appeal-card", (e) => {
            e.preventDefault();
            const id = this._props.id;
            // Переходим на детальную страницу!
            router.navigate(`/my_appeals/${id}`);
        });
    }
}