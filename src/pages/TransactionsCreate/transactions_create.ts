import { BasePage } from "../base_page";
import { TransactionForm } from "../../components/TransactionsForm/transactions_form";
// @ts-ignore
import template from "./transactions_create.hbs?raw";
import "./transactions_create.scss";

/**
 * Страница создания новой транзакции.
 * @class TransactionCreatePage
 * @extends BasePage
 */
export class TransactionCreatePage extends BasePage {
    async render(root: HTMLElement): Promise<void> {
        root.innerHTML = `
            <div class="page">
                <main class="page__content">${template}</main>
            </div>
        `;

        const formContainer = root.querySelector<HTMLElement>("#form_container")!;
        const form = new TransactionForm();
        form.render(formContainer);
        this._components.push(form);
    }
}