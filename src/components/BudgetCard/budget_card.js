import { BaseComponent } from "../base_component.js";
import template from "./budget_card.hbs?raw";

/**
 * Компонент карточки бюджета.
 * Отвечает за отображение информации о конкретном бюджете, расчет процента выполнения
 * и форматирование финансовых данных и дат для локали ru-RU.
 * * @class BudgetCard
 * @extends BaseComponent
 */
export class BudgetCard extends BaseComponent {
    /**
     * Создает экземпляр карточки бюджета.
     * @param {Object} props - Свойства компонента.
     * @param {number} props.id - Уникальный идентификатор бюджета.
     * @param {Function} props.onDelete - Колбэк-функция, вызываемая при удалении (принимает id и title).
     * @param {Object} props.budget - Объект с данными бюджета.
     * @param {string} [props.budget.title] - Название бюджета.
     * @param {number} props.budget.actual - Текущая потраченная/накопленная сумма.
     * @param {number} props.budget.target - Целевая сумма бюджета.
     * @param {string} [props.budget.currency] - Валюта (по умолчанию "RUB").
     * @param {string} [props.budget.start_at] - Дата начала в формате ISO.
     * @param {string} [props.budget.end_at] - Дата окончания в формате ISO.
     */
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

    /**
     * Устанавливает обработчики событий для элементов карточки.
     * Настраивает кнопку удаления бюджета.
     * @private
     */
    _addEventListeners() {
        const deleteBtn = this._element.querySelector(".budget-card__delete-btn");
        this._on(deleteBtn, "click", () => this._onDelete(this._id, this._props.title));
    }
}