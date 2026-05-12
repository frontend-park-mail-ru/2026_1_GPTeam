import {BaseComponent} from "../base_component.ts";
import template from "./csv_import.hbs?raw";
import "./csv_import.scss";
import {import_csv} from "../../api/transactions.ts";

export class CsvImport extends BaseComponent {
    constructor(props: Record<string, any>) {
        super(template, props);
    }

    protected _addEventListeners() {
        let btn: HTMLButtonElement | null | undefined = this.getElement()?.querySelector<HTMLButtonElement>("#import_btn");
        if (!btn) return;
        let input: HTMLInputElement | null | undefined = this.getElement()?.querySelector<HTMLInputElement>("#import_input");
        if (!input) return;
        let error: HTMLElement | null | undefined = this.getElement()?.querySelector<HTMLElement>("#import_error");
        if (error)
            error.innerText = "";

        this._on(btn, "click", async (e) => {
            e.preventDefault();
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

            btn.disabled = true;
            try {
                let response = await import_csv(file);
                if (!response.success) {
                    let message: string | undefined = response.errors?.[0].message;
                    if (!message)
                        message = "Ошибка сервера";
                    if (error)
                        error.innerText = message;
                    else
                        console.error(message);
                }
            }
            catch (err) {
                let message: string = err instanceof Error ? err.message : "Не удалось сохранить аватар";
                if (error)
                    error.innerText = message;
                else
                    console.error(message);
            }
            finally {
                btn.disabled = false;
            }
        });
    }
}
