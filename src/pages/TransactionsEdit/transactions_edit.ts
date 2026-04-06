import { BasePage } from "../base_page.ts";
import { TransactionForm } from "../../components/TransactionsForm/transactions_form";
import { fetchTransactionDetail, updateTransaction } from "../../api/transactions";
import { router } from "../../router/router_instance";
import type { TransactionCreateRequest } from "../../types/interfaces";
// @ts-ignore
import template from "./transactions_edit.hbs?raw";
import "./transactions_edit.scss";

/**
 * Страница редактирования транзакции.
 * @class TransactionEditPage
 * @extends BasePage
 */
export class TransactionEditPage extends BasePage {
    private _transactionId: number | null = null;
    private _formComponent: TransactionForm | null = null;

    /**
     * @param {Record<string, string>} params
     */
    constructor(private _params: Record<string, string>) {
        super();
    }

    /**
     * @param {HTMLElement} root
     * @returns {Promise<void>}
     */
    async render(root: HTMLElement): Promise<void> {
        root.innerHTML = `
            <div class="page">
                <main class="page__content">${template}</main>
            </div>
        `;

        this._transactionId = this._params["id"] ? parseInt(this._params["id"]) : null;

        if (!this._transactionId || isNaN(this._transactionId)) {
            router.navigate("/operations");
            return;
        }

        try {
            const transactionData = await fetchTransactionDetail(this._transactionId);
            console.log("transactionData:", transactionData);
            
            if (!transactionData) {
                router.navigate("/operations");
                return;
            }

            const formContainer = root.querySelector<HTMLElement>("#form_container")!;
            
            this._formComponent = new TransactionForm(
                {
                    account_id: transactionData.account_id,
                    value: transactionData.value,
                    type: transactionData.type,
                    category: transactionData.category,
                    currency: transactionData.currency,
                    title: transactionData.title,
                    description: transactionData.description,
                    transaction_date: transactionData.transaction_date,
                },
                async (data: TransactionCreateRequest) => {
                    await this._handleFormSubmit(data, root);
                }
            );
            
            await this._formComponent.render(formContainer);
            this._components.push(this._formComponent);

        } catch (err) {
            console.error("Failed to load transaction for edit", err);
            router.navigate("/operations");
        }
    }

    /**
     * @private
     * @param {TransactionCreateRequest} data
     * @param {HTMLElement} root
     * @returns {Promise<void>}
     */
    private async _handleFormSubmit(data: TransactionCreateRequest, root: HTMLElement): Promise<void> {
        if (!this._transactionId) return;

        const errorBlock = root.querySelector<HTMLElement>("#error-message");
        
        try {
            if (errorBlock) errorBlock.classList.add("hidden");

            const result = await updateTransaction(this._transactionId, data);

            if (result.success) {
                router.navigate(`/operations`);
            } else {
                if (errorBlock) {
                    errorBlock.textContent = result.errors?.[0]?.message || "Ошибка при сохранении транзакции";
                    errorBlock.classList.remove("hidden");
                }
                
                if (result.errors && this._formComponent) {
                    this._formComponent.markFieldsInvalid(result.errors);
                }
            }
        } catch (err: any) {
            if (errorBlock) {
                errorBlock.classList.remove("hidden");
                errorBlock.textContent = "Произошла ошибка сети";
            }
        }
    }
}