import { BaseComponent } from "../base_component";
// @ts-ignore
import template from "./transaction_card.hbs?raw";
import "./transaction_card.scss";
import { Transaction } from "../../types/interfaces";
import { deleteTransaction } from "../../api/transactions";
import { Modal } from "../Modal/modal";
import { router } from "../../router/router_instance";

/**
 * Обрезает строку до maxLen символов с добавлением '...'.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
function truncate(str: string, maxLen: number): string {
    if (!str) return "";
    return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

/**
 * Компонент карточки транзакции.
 * @class TransactionCard
 * @extends BaseComponent
 */
export class TransactionCard extends BaseComponent {
    private _data: Transaction;
    private _onDeleted?: (id: number) => void;

    /**
     * @param {Transaction} props
     * @param {(id: number) => void} [onDeleted]
     */
    constructor(props: Transaction, onDeleted?: (id: number) => void) {
        const type = props.type.toLowerCase() === "income" ? "income" : "expense";
        const rawAmount = props.value.toLocaleString("ru-RU", { minimumFractionDigits: 2 });
        const amount = truncate(
            rawAmount.length > 12
                ? props.value.toLocaleString("ru-RU", { maximumFractionDigits: 0 })
                : rawAmount,
            12
        );

        super(template, {
            ...props,
            type,
            amount_sign: type === "income" ? "+" : "−",
            amount,
            date: new Date(props.transaction_date).toLocaleDateString("ru-RU"),
            category_icon: type === "income" ? "💰" : "🛒",
            category_title: truncate(props.category, 10),
            title: truncate(props.title, 18),
            note: truncate(props.description, 15),
        });
        this._data = props;
        this._onDeleted = onDeleted;
    }

    /**
     * @protected
     */
    protected _addEventListeners(): void {
        const el = this.getElement();
        if (!el) return;

        el.querySelector("[data-action='detail']")?.addEventListener("click", () => {
            router.navigate(`/operations/${this._data.id}`);
        });

        // Обработчик кнопки "Изменить"
        el.querySelector("[data-action='edit']")?.addEventListener("click", () => {
            router.navigate(`/transactions/edit/${this._data.id}`);
        });

        el.querySelector("[data-action='delete']")?.addEventListener("click", () => {
            this._confirmDelete();
        });
    }

    /**
     * Показывает модальное окно подтверждения удаления.
     * @private
     */
    private _confirmDelete(): void {
        const modal = new Modal({
            title: "Удалить транзакцию?",
            message: `Вы уверены, что хотите удалить транзакцию «${this._data.title}»? Статистика категории «${this._data.category}» и баланс счёта будут пересчитаны. Это действие нельзя отменить.`,
            confirmText: "Удалить",
            cancelText: "Отмена",
            onConfirm: () => {
                this._handleDelete(modal);
            },
            onCancel: () => {
                modal.destroy();
            },
        });
        modal.render(document.body);
    }

    /**
     * Удаляет транзакцию и вызывает колбэк при успехе.
     * @private
     * @param {Modal} modal - модальное окно для подтверждения удаления.
     */
    private async _handleDelete(modal: Modal): Promise<void> {
        const el = this.getElement();
        const deleteBtn = el?.querySelector<HTMLButtonElement>("[data-action='delete']");
        if (deleteBtn) deleteBtn.disabled = true;

        try {
            const [ok, message] = await deleteTransaction(this._data.id);
            if (ok) {
                modal.destroy();
                el?.remove();
                this._onDeleted?.(this._data.id);
            } else {
                modal.show_error(message);
                if (deleteBtn) deleteBtn.disabled = false;
            }
        } catch {
            if (deleteBtn) deleteBtn.disabled = false;
            modal.destroy();
        }
    }
}