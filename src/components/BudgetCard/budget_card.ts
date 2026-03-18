import { BaseComponent } from "../base_component.js";
import template from "./budget_card.hbs?raw";
import "./budget_card.css";

interface Budget {
    title?: string;
    description?: string;
    actual: number;
    target: number;
    currency?: string;
    start_at?: string;
    end_at?: string;
}

interface BudgetCardProps extends Record<string, unknown> {
    id: number;
    onDelete: (id: number, title: string) => void;
    budget: Budget;
}

/**
 * Компонент карточки бюджета.
 * Отвечает за отображение информации о конкретном бюджете, расчет процента выполнения
 * и форматирование финансовых данных и дат для локали ru-RU.
 *
 * @class BudgetCard
 * @extends BaseComponent
 */
export class BudgetCard extends BaseComponent {
    private _id: number;
    private _onDelete: (id: number, title: string) => void;

    /**
     * Создает экземпляр карточки бюджета.
     * @param {BudgetCardProps} props - Свойства компонента.
     */
    constructor(props: BudgetCardProps) {
        const formatDate = (dateStr?: string): string => {
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
        const is_default_date = props.budget.end_at === "0001-01-01T00:00:00Z";

        super(template, {
            title: props.budget.title || "—",
            description: props.budget.description || "",
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

    /**
     * Устанавливает обработчики событий для элементов карточки.
     * Настраивает кнопку удаления бюджета.
     * @protected
     */
    protected _addEventListeners(): void {
        const deleteBtn = this._element?.querySelector<HTMLElement>(".budget-card__delete-btn");
        if (deleteBtn) {
            this._on(deleteBtn, "click", () => this._onDelete(this._id, this._props.title as string));
        }
    }
}