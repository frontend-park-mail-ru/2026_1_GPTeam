import { BaseComponent } from "../base_component.ts"; // Проверь правильность пути
import template from "./appeal_card.hbs?raw";
import "./appeal_card.scss";
import type { AppealCardProps } from "../../types/interfaces.ts"; // Импорт интерфейса

export class AppealCard extends BaseComponent {
    constructor(props: AppealCardProps) {
        // Передаем шаблон и пропсы родителю, он сам скомпилирует и сохранит
        super(template, props);
    }

    // Если в карточке понадобятся клики (например, открыть детали тикета), 
    // раскомментируй этот блок:
    /*
    protected _addEventListeners(): void {
        this._delegate("click", ".appeal-card", (e, target) => {
            const id = this._props.id;
            console.log("Клик по карточке:", id);
        });
    }
    */
}