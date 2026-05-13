import {BaseComponent} from "../base_component.ts";
import template from "./csv_import.hbs?raw";
import "./csv_import.scss";
import {import_csv} from "../../api/transactions.ts";
import {ModalMessage} from "../ModalMessage/modal_message.ts";
import {router} from "../../router/router_instance.ts";
import {CustomSelect} from "../CustomSelect/custom_select.ts";
import type {ShortAccount, ShortAccountResponse} from "../../types/interfaces.ts";
import {get_short_accounts} from "../../api/accounts.ts";

export class CsvImport extends BaseComponent {
    protected _account_select: CustomSelect | null = null;
    protected _accounts_display: HTMLElement | null | undefined = null;
    protected _accounts_input: HTMLInputElement | null | undefined = null;
    protected _accounts_dropdown: HTMLElement | null | undefined = null;

    constructor(props: Record<string, any>) {
        super(template, props);
    }

    protected async fill_accounts_select(): Promise<void> {
        this._accounts_display = this.getElement()?.querySelector<HTMLElement>("#account_display");
        this._accounts_input = this.getElement()?.querySelector<HTMLInputElement>("#account_input");
        this._accounts_dropdown = this.getElement()?.querySelector<HTMLElement>("#account_dropdown");
        if (!this._accounts_display || !this._accounts_input || !this._accounts_dropdown) {
            return;
        }
        const accounts: ShortAccountResponse = await get_short_accounts();
        if (accounts.accounts.length === 0) {
            this._accounts_dropdown.innerHTML = `<div class="custom-select__option" style="opacity:0.4;cursor:default">Нет счетов</div>`;
            return;
        }
        this._accounts_dropdown.innerHTML = accounts.accounts
            .map((acc: ShortAccount) => `<div class="custom-select__option" data-value="${acc.id}">${acc.name}</div>`)
            .join("");
        this._account_select = new CustomSelect(this._accounts_display, this._accounts_input, this._accounts_dropdown);
    }

    protected _addEventListeners(): void {
        let btn: HTMLButtonElement | null | undefined = this.getElement()?.querySelector<HTMLButtonElement>("#import_btn");
        if (!btn) return;
        let input: HTMLInputElement | null | undefined = this.getElement()?.querySelector<HTMLInputElement>("#import_input");
        if (!input) return;
        let error: HTMLElement | null | undefined = this.getElement()?.querySelector<HTMLElement>("#import_error");
        if (!error) return;
        this._on(btn, "click", async (e: Event) => await this.send_file(e, input, btn, error));

        this._on(input, "change", async () => this.upload_file(input));

        let checkbox: HTMLInputElement | null | undefined = this.getElement()?.querySelector<HTMLInputElement>("#another_service_import_checkbox");
        if (!checkbox) return;
        this._on(checkbox, "click", () => this.switch_account_selector(checkbox));

        document.addEventListener("click", () => this._account_select?.close());
    }

    protected async _afterRender(): Promise<void> {
        await this.fill_accounts_select();
    }

    protected switch_account_selector(checkbox: HTMLInputElement): void {
        let selector: HTMLElement | null | undefined = this.getElement()?.querySelector<HTMLElement>(".import-block__account-selector");
        if (!selector) return;
        if (checkbox!.checked)
            this.enable_account_selector(selector);
        else
            this.disable_account_selector(selector);
    }

    protected enable_account_selector(selector: HTMLElement): void {
        selector.classList.remove("disabled");
    }

    protected disable_account_selector(selector: HTMLElement): void {
        selector.classList.add("disabled");
    }

    protected upload_file(input: HTMLInputElement): void {
        let label: HTMLElement | null | undefined = this.getElement()?.querySelector<HTMLElement>(".import-block__file-label");
        let filename: string | undefined = input.value.split('\\').pop();
        if (!filename)
            filename = input.value;
        if (label)
            label.innerText = filename;
    }

    protected async send_file(e: Event, input: HTMLInputElement, btn: HTMLButtonElement, error: HTMLElement): Promise<void> {
        e.preventDefault();
        error.innerText = "";
        let file: File | undefined = input?.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            if (error)
                error.innerText = "Файл слишком большой. Максимум 5 МБ";
            else
                console.error("Файл слишком большой. Максимум 5 МБ");
            input.value = "";
            return;
        }
        if (file.type !== "text/csv") {
            if (error)
                error.innerText = "Можно загружать только CSV";
            else
                console.error("Можно загружать только CSV");
            input.value = "";
            return;
        }

        let account_input: HTMLInputElement | null | undefined = this.getElement()?.querySelector<HTMLInputElement>("#account_input");
        if (!account_input) return;
        let account_value: string = account_input.value;

        btn.disabled = true;
        input!.value = "";
        this._account_select?.close();
        try {
            let response = await import_csv(file, account_value);
            let message: string = "Транзакции импортированы."
            if (!response.success)
                message = "Произошла ошибка. Применены только валидные транзакции.";
            let modal: ModalMessage = new ModalMessage(message, () => router.refresh());
            modal.render(document.body);
        }
        catch (err) {
            let message: string = err instanceof Error ? err.message : "Не удалось загрузить файл";
            let modal: ModalMessage = new ModalMessage(message, () => router.refresh());
            modal.render(document.body);
        }
        finally {
            btn.disabled = false;
        }
    }
}
