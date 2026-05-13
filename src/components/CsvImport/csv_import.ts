import {BaseComponent} from "../base_component.ts";
import template from "./csv_import.hbs?raw";
import "./csv_import.scss";
import {import_csv} from "../../api/transactions.ts";
import {ModalMessage} from "../ModalMessage/modal_message.ts";
import {router} from "../../router/router_instance.ts";

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
            input!.value = "";
            try {
                let response = await import_csv(file);
                let message: string = "Транзакции импортированы."
                if (!response.success)
                    message = "Произошла ошибка. Применены только валидные транзакции.";
                let modal: ModalMessage = new ModalMessage(message, () => router.refresh());
                modal.render(document.body);
            }
            catch (err) {
                let message: string = err instanceof Error ? err.message : "Не удалось загрузить файл";
                let modal: ModalMessage = new ModalMessage(message, () => router.navigate("/operations"));
                modal.render(document.body);
            }
            finally {
                btn.disabled = false;
            }
        });
    }
}
