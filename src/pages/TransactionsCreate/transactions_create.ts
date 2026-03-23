import { BasePage } from "../base_page";
import { Header } from "../../components/Header/header";
import { TransactionForm } from "../../components/TransactionsForm/transactions_form";
// @ts-ignore
import template from "./transactions_create.hbs?raw";
import "./transactions_create.css";

/**
 * Страница создания новой транзакции.
 * @class TransactionCreatePage
 * @extends BasePage
 */
export class TransactionCreatePage extends BasePage {
    async render(root: HTMLElement): Promise<void> {
        root.innerHTML = `
            <div class="page">
                <header class="page__header"></header>
                <main class="page__content">${template}</main>
            </div>
        `;

        const header = new Header({ cur_page: "/operations" });
        header.render(root.querySelector(".page__header") as HTMLElement);
        this._components.push(header);

        const formContainer = root.querySelector<HTMLElement>("#form_container")!;
        const form = new TransactionForm();
        form.render(formContainer);
        this._components.push(form);
    }
}