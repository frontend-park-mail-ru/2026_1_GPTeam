import { BaseComponent } from "../base_component.ts";
import template from "./csv_export.hbs?raw";
import "./csv_export.scss";
import { export_csv } from "../../api/transactions.ts";
import { ModalMessage } from "../ModalMessage/modal_message.ts";
import { CustomSelect } from "../CustomSelect/custom_select.ts";
import type { ShortAccount, ShortAccountResponse } from "../../types/interfaces.ts";
import { get_short_accounts } from "../../api/accounts.ts";

export class CsvExport extends BaseComponent {
    protected _account_select: CustomSelect | null = null;
    protected _accounts_display: HTMLElement | null | undefined = null;
    protected _accounts_input: HTMLInputElement | null | undefined = null;
    protected _accounts_dropdown: HTMLElement | null | undefined = null;
    protected _has_accounts = false;

    constructor(props: Record<string, unknown>) {
        super(template, props);
    }

    protected async fill_accounts_select(): Promise<void> {
        this._accounts_display = this.getElement()?.querySelector<HTMLElement>("#export_account_display");
        this._accounts_input = this.getElement()?.querySelector<HTMLInputElement>("#export_account_input");
        this._accounts_dropdown = this.getElement()?.querySelector<HTMLElement>("#export_account_dropdown");
        if (!this._accounts_display || !this._accounts_input || !this._accounts_dropdown) {
            return;
        }
        const accounts: ShortAccountResponse = await get_short_accounts();
        if (accounts.accounts.length === 0) {
            this._has_accounts = false;
            this._accounts_dropdown.innerHTML = `<div class="custom-select__option" style="opacity:0.4;cursor:default">Нет счетов</div>`;
            return;
        }
        this._has_accounts = true;
        this._accounts_dropdown.innerHTML = accounts.accounts
            .map((acc: ShortAccount) => `<div class="custom-select__option" data-value="${acc.id}">${acc.name}</div>`)
            .join("");
        this._account_select = new CustomSelect(this._accounts_display, this._accounts_input, this._accounts_dropdown);
    }

    protected _addEventListeners(): void {
        const btn = this.getElement()?.querySelector<HTMLButtonElement>("#export_btn");
        if (!btn) return;
        this._on(btn, "click", async (e: Event) => await this.export_transactions(e, btn));

        document.addEventListener("click", () => this._account_select?.close());
    }

    protected async _afterRender(): Promise<void> {
        await this.fill_accounts_select();
    }

    protected downloadFile(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    protected async export_transactions(e: Event, btn: HTMLButtonElement): Promise<void> {
        e.preventDefault();
        const error = this.getElement()?.querySelector<HTMLElement>("#export_error");
        if (error) error.innerText = "";

        if (!this._has_accounts) {
            if (error) error.innerText = "Нет доступных счетов для экспорта";
            return;
        }

        const account_input = this.getElement()?.querySelector<HTMLInputElement>("#export_account_input");
        if (!account_input?.value) {
            if (error) error.innerText = "Выберите счёт для экспорта";
            return;
        }

        btn.disabled = true;
        this._account_select?.close();
        try {
            const { blob, filename } = await export_csv(account_input.value);
            this.downloadFile(blob, filename);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Не удалось экспортировать транзакции";
            const modal = new ModalMessage(message);
            modal.render(document.body);
        } finally {
            btn.disabled = false;
        }
    }
}
