import {BaseComponent} from "../base_component.ts";
import template from "./budget_edit_form.hbs?raw";
import "./budget_edit_form.scss";
import {router} from "../../router/router_instance.ts";
import {BudgetUpdateRequest} from "../../types/interfaces.ts";
import {update_budget} from "../../api/budget.ts";
import {clean_data} from "../../utils/xss.ts";

interface BudgetEditFormData {
    title: string
    description: string;
    target: number;
}

interface BudgetEditFormFields {
    title: HTMLInputElement | null;
    description: HTMLInputElement | null;
    target: HTMLInputElement | null;
}

export class BudgetEditForm extends BaseComponent {
    private _init_data: BudgetEditFormData;
    private _id: number;

    constructor(init_data: BudgetEditFormData, id: number) {
        super(template);
        this._init_data = init_data;
        this._id = id;
    }

    protected async _afterRender(): Promise<void> {
        let title_input = this.getElement()?.querySelector<HTMLInputElement>("#title_input");
        if (title_input) {
            title_input.value = this._init_data.title;
        }
        let description_input = this.getElement()?.querySelector<HTMLInputElement>("#description_input");
        if (description_input) {
            description_input.value = this._init_data.description;
        }
        let target_input = this.getElement()?.querySelector<HTMLInputElement>("#target_input");
        if (target_input) {
            target_input.value = this._init_data.target.toString();
        }
    }

    protected _addEventListeners() {
        let cancel_btn: HTMLElement | null | undefined = this.getElement()?.querySelector<HTMLElement>("#cancel_btn");
        if (cancel_btn) {
            this._on(cancel_btn, "click", () => router.navigate("/budget"));
        }
        let form: HTMLElement | null = this.getElement();
        if (form) {
            this._on(form, "submit", (e) => this._submit(e));
        }
    }

    private async _submit(e: Event) {
        e.preventDefault();
        let form: HTMLElement | null = this.getElement();
        if (!form) return;

        let fields: BudgetEditFormFields = {
            title: form.querySelector("#title_input"),
            description: form.querySelector("#description_input"),
            target: form.querySelector("#target_input"),
        };
        let error_message: HTMLElement | null = form.querySelector<HTMLElement>("#error_message");
        if (!error_message) {
            return;
        }

        if (this.validate(fields, error_message)) return;

        let submit_btn: HTMLButtonElement | null = form.querySelector<HTMLButtonElement>("button[type='submit']");
        if (submit_btn) submit_btn.disabled = true;
        try {

            let payload: BudgetUpdateRequest = {
                title: fields.title!.value,
                description: fields.description!.value,
                target: Number(fields.target!.value),
            };
            console.log(payload)
            let response = await update_budget(this._id, payload);
            if (response && response.success) {
                router.navigate("/budget");
            }
            else if (response && response.errors && response.errors.length > 0) {
                this.markFieldsInvalid(response.errors);
                let first_error = response.errors.find((err: {field: string, message: string}) => err.field !== "");
                if (error_message)
                    error_message.innerText = first_error ? first_error.message : response.errors[0].message;
                else
                    console.error(first_error ? first_error.message : response.errors[0].message);
            }
            else {
                if (error_message)
                    error_message.innerText = "Не удалось создать транзакцию";
                else
                    console.error("Не удалось создать транзакцию");
            }
        }
        catch (error) {
            if (error_message)
                error_message.innerText = "Сервер недоступен";
            else
                console.error("Сервер недоступен");
        }
        finally {
            if (submit_btn) submit_btn.disabled = false;
        }
    }

    private markFieldsInvalid(errors: Array<{ field: string; message: string }>): void {
        const form: HTMLElement | null = this.getElement();
        if (!form) return;
        this._clearValidationErrors();
        const fields: Record<string, string> = {
            "title": "#title_input",
            "description": "#description_input",
            "target": "#target_input",
        };

        errors.forEach((err: {field: string, message: string}) => {
            let selector: string = fields[err.field];
            if (selector) {
                let input: HTMLInputElement | null = form.querySelector<HTMLInputElement>(selector);
                if (input) {
                    input.style.borderColor = "red";
                    input.classList.add("budget-edit-form__input--invalid");
                }
            }
        });
    }

    private _clearValidationErrors(): void {
        const form: HTMLElement | null = this.getElement();
        if (!form) return;
        let inputs: NodeListOf<HTMLInputElement> = form.querySelectorAll<HTMLInputElement>("input");
        inputs.forEach((input: HTMLInputElement) => {
            input.style.borderColor = "";
            input.classList.remove("budget-edit-form__input--invalid");
        });
    }

    private validate(fields: BudgetEditFormFields, error_message: HTMLElement): boolean {
        for (let elem in fields) {
            let field: any = fields[elem as keyof BudgetEditFormFields];
            if (field)
                field.value = clean_data(field.value);
        }
        const { title, description, target } = fields;
        let errors: boolean = false;
        let error_text: string = "";

        const form: HTMLElement | null = this.getElement();
        if (!form) return true;
        [title, description]
            .forEach((field: HTMLInputElement | null) =>  {
                if (field)
                    field.style.borderColor = "rgba(72, 79, 255, 0.5)"
            });

        if (!title || !title.value.trim()) {
            errors = true;
            if (title) title.style.borderColor = "red";
            if (!error_text) error_text = "Введите название";
        }
        else if (title.value.trim().length > 255) {
            errors = true;
            title.style.borderColor = "red";
            if (!error_text) error_text = "Название не должно превышать 255 символов";
        }
        if (!description || !description.value.trim()) {
            errors = true;
            if (description) description.style.borderColor = "red";
            if (!error_text) error_text = "Введите описание";
        }
        if (!target || isNaN(Number(target.value)) || Number(target.value) <= 0 || Number(target.value) > 1_000_000_000) {
            errors = true;
            if (target) target.style.borderColor = "red";
            if (!error_text) error_text = "Значение бюджета должно быть положительным числом до 1 000 000 000";
        }
        error_message.innerText = error_text;
        return errors;
    }
}
