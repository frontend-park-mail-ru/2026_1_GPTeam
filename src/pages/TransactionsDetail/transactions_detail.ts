import { BasePage } from "../base_page";
import { fetchTransactionDetail, deleteTransaction } from "../../api/transactions";
import { router } from "../../router/router_instance";
import { Modal } from "../../components/Modal/modal";
import Handlebars from "handlebars";
// @ts-ignore
import template from "./transactions_detail.hbs?raw";
import "./transactions_detail.css";

/**
 * Страница детального просмотра транзакции.
 * Маршрут: /operations/:id
 * @class TransactionDetailPage
 * @extends BasePage
 */
export class TransactionDetailPage extends BasePage {
    private _transactionId: number;

    /**
     * @param {number} id - ID транзакции из параметров маршрута.
     */
    constructor(id: number) {
        super();
        this._transactionId = id;
    }

    async render(root: HTMLElement): Promise<void> {
        root.innerHTML = `
            <div class="page">
                <main class="page__content">
                    <div class="transaction-detail-page" id="detail_root">
                        <div class="detail-loading">Загрузка...</div>
                    </div>
                </main>
            </div>
        `;

        await this._loadDetail(root.querySelector<HTMLElement>("#detail_root")!);
    }

    /**
     * Загружает данные транзакции и рендерит страницу.
     * @private
     * @param {HTMLElement} container
     */
    private async _loadDetail(container: HTMLElement): Promise<void> {
        const data = await fetchTransactionDetail(this._transactionId);

        if (!data) {
            container.innerHTML = `<div class="detail-error">Транзакция не найдена</div>`;
            return;
        }

        const type = data.type.toLowerCase() === "income" ? "income" : "expense";
        const compiled = Handlebars.compile(template);
        container.innerHTML = compiled({
            ...data,
            type,
            type_label: type === "income" ? "Доход" : "Расход",
            amount_sign: type === "income" ? "+" : "−",
            amount: data.value.toLocaleString("ru-RU", { minimumFractionDigits: 2 }),
            date: new Date(data.transaction_date).toLocaleDateString("ru-RU"),
            created_at: new Date(data.created_at).toLocaleDateString("ru-RU"),
            category_icon: type === "income" ? "💰" : "🛒",
            currency: "RUB",
        });

        container.querySelector("#back_btn")?.addEventListener("click", () => {
            router.navigate("/operations");
        });

        container.querySelector("#delete_btn")?.addEventListener("click", () => {
            this._confirmDelete(container);
        });
    }

    /**
     * Показывает модальное окно подтверждения удаления.
     * @private
     * @param {HTMLElement} container
     */
    private _confirmDelete(container: HTMLElement): void {
        const modal = new Modal({
            title: "Удалить операцию?",
            message: "Операция будет удалена безвозвратно.",
            confirmText: "Удалить",
            cancelText: "Отмена",
            onConfirm: () => {
                modal.destroy();
                this._handleDelete(container);
            },
            onCancel: () => {
                modal.destroy();
            },
        });
        modal.render(document.body);
    }

    /**
     * Удаляет транзакцию и перенаправляет на список.
     * @private
     * @param {HTMLElement} container
     */
    private async _handleDelete(container: HTMLElement): Promise<void> {
        const btn = container.querySelector<HTMLButtonElement>("#delete_btn");
        if (btn) btn.disabled = true;

        try {
            const ok = await deleteTransaction(this._transactionId);
            if (ok) {
                router.navigate("/operations");
            } else {
                if (btn) btn.disabled = false;
            }
        } catch {
            if (btn) btn.disabled = false;
        }
    }
}