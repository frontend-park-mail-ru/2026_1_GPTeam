import { BaseComponent } from "../base_component.js";
import template from "./budget_card.hbs?raw";

export class BudgetCard extends BaseComponent {
    constructor(props) {
        const formatDate = (dateStr) => {
            if (!dateStr) return "—";
            return new Date(dateStr).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        };

        const percent = props.budget.target > 0
            ? Math.min(Math.round((props.budget.actual / props.budget.target) * 100), 100)
            : 0;

        const currency = (props.budget.currency || "RUB").toUpperCase();

        let is_default_date = props.budget.end_at === "0001-01-01T00:00:00Z";

        super(template, {
            title: props.budget.title || "—",
            actual: props.budget.actual.toLocaleString("ru-RU"),
            target: props.budget.target.toLocaleString("ru-RU"),
            currency,
            percent,
            start_at: formatDate(props.budget.start_at),
            end_at: is_default_date ? "нет" : formatDate(props.budget.end_at),
        });

        this._id = props.id;
        this._onDelete = props.onDelete;
    }

    _addEventListeners() {
        const deleteBtn = this._element.querySelector(".budget-card__delete-btn");
        this._on(deleteBtn, "click", () => this._onDelete(this._id, this._props.title));
    }
}