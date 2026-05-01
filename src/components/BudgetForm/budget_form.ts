import { BaseComponent } from "../base_component.ts";
import template from "./budget_form.hbs?raw";
import "./budget_form.scss";
import { client } from "../../api/client.ts";
import {get_categories} from "../../store/store.ts";
import { router } from "../../router/router_instance.ts";
import { CustomCalendar } from "../CustomCalendar/custom_calendar.ts";
import {
    is_empty, validate_categories,
    validate_end_date,
    validate_start_date,
} from "../../utils/validation.ts";
import {clean_data} from "../../utils/xss.ts";
import {CustomCheckBox} from "../CustomCheckBox/custom_check_box.ts";

interface BudgetFormFields {
    title: HTMLInputElement | null;
    description: HTMLInputElement | null;
    target: HTMLInputElement | null;
    category: HTMLInputElement[];
    start_at: HTMLInputElement | null;
    end_at: HTMLInputElement | null;
}

/**
 * Компонент формы создания/редактирования бюджета.
 * @class BudgetForm
 * @extends BaseComponent
 */
export class BudgetForm extends BaseComponent {
    private serverTime: Date | null = null;
    private _startCal: CustomCalendar | null = null;
    private _endCal: CustomCalendar | null = null;
    private _categorySelect: CustomCheckBox | null = null;

    constructor(props: Record<string, unknown>) {
        super(template, props);
    }

    protected async _afterRender(): Promise<void> {
        await this._fetchServerTime();
    }

    /**
     * Запрашивает время сервера для корректной работы ограничений дат.
     * @private
     */
    private async _fetchServerTime(): Promise<void> {
        try {
            const response = await client("/api/get_budgets", { method: "GET", credentials: "include" });
            const dateHeader = response.headers.get("date");
            this.serverTime = dateHeader ? new Date(dateHeader) : new Date();
        } catch {
            this.serverTime = new Date();
        }
    }

    protected _addEventListeners(): void {
        const form = this.getElement();
        if (!form) return;

        this._initSelect(form);
        this._initCalendars(form);

        this._on(form, "submit", (e) => this.submit(e));

        document.addEventListener("click", () => {
            this._startCal?.close();
            this._endCal?.close();
            this._categorySelect?.close();
        });
    }

    /**
     * Инициализирует выпадающий список выбора категории.
     * @private
     */
    private _initSelect(form: Element): void {
        const display = form.querySelector<HTMLElement>("#category_display");
        const dropdown = form.querySelector<HTMLElement>("#category_dropdown");
        if (display && dropdown && get_categories().length > 0) {
            this._categorySelect = new CustomCheckBox(display, dropdown, "category", get_categories(), get_categories());
        }
    }

    /**
     * Инициализирует календари с зависимой логикой и поддержкой ручного ввода.
     * @private
     */
    private _initCalendars(form: Element): void {
        const today = this.serverTime ? new Date(this.serverTime) : new Date();
        today.setHours(0, 0, 0, 0);

        const maxDate = new Date(today);
        maxDate.setFullYear(maxDate.getFullYear() + 5);

        const startPopup = form.querySelector<HTMLElement>("#start_at_calendar")!;
        const startDisplay = form.querySelector<HTMLInputElement>("#start_at_display")!;
        const startInput = form.querySelector<HTMLInputElement>("#start_at_input")!;
        const startBtn = form.querySelector<HTMLElement>("#start_at_calendar_btn")!;

        const endPopup = form.querySelector<HTMLElement>("#end_at_calendar")!;
        const endDisplay = form.querySelector<HTMLInputElement>("#end_at_display")!;
        const endInput = form.querySelector<HTMLInputElement>("#end_at_input")!;
        const endBtn = form.querySelector<HTMLElement>("#end_at_calendar_btn")!;

    this._startCal = new CustomCalendar(startPopup, startDisplay, startInput, today, (date) => {
        const minForEnd = date || today;
        this._endCal?.setMinDate(minForEnd);
        if (date) this._endCal?.setView(date);
        const endVal = this._endCal?.getValue();
        if (endVal && date && endVal < date) this._endCal?.clearSelection();

        const endMax = new Date(date || today);
        endMax.setFullYear(endMax.getFullYear() + 5);
        this._endCal?.setMaxDate(endMax);
    });
    this._startCal.setMaxDate(maxDate);

    this._endCal = new CustomCalendar(endPopup, endDisplay, endInput, today);
    this._endCal.setMaxDate(maxDate);

        const toggleStart = (e: Event) => {
            e.stopPropagation();
            this._endCal?.close();
            this._categorySelect?.close();
            this._startCal?.toggle();
        };
        this._on(startBtn, "click", toggleStart);
        this._on(startDisplay, "click", toggleStart);

        const toggleEnd = (e: Event) => {
            e.stopPropagation();
            const startVal = this._startCal?.getValue();
            const minForEnd = startVal || today;
            this._endCal?.setMinDate(minForEnd);
            if (startVal) this._endCal?.setView(startVal);
            this._startCal?.close();
            this._categorySelect?.close();
            this._endCal?.toggle();
        };
        this._on(endBtn, "click", toggleEnd);
        this._on(endDisplay, "click", toggleEnd);
    }

    /**
     * Выполняет валидацию полей формы.
     * @param {BudgetFormFields} fields
     * @param {HTMLElement} error_message
     * @returns {boolean} true если есть ошибки
     */
    validate(fields: BudgetFormFields, error_message: HTMLElement): boolean {
        for (let elem in fields) {
            let field: HTMLInputElement | HTMLInputElement[] | null = fields[elem as keyof BudgetFormFields];
            if (field && !(field instanceof Array)) {
                field.value = clean_data(field.value);
            }
        }
        const { title, description, target, category, start_at, end_at } = fields;
        let errors = false;
        let errorText = "";

        [title, description, target, start_at, end_at]
            .filter((f): f is HTMLInputElement => f !== null)
            .forEach(f => f.style.borderColor = "rgba(72, 79, 255, 0.5)");

        const required: [HTMLInputElement, string][] = [
            [title!, "Название"],
            [description!, "Описание"],
            [target!, "Планируемый бюджет"],
            [start_at!, "Дата начала"],
        ];

        let [ok, err] = validate_categories(category.map((elem: HTMLInputElement) => elem.value));
        if (!ok) {
            errors = true;
            if (!errorText) errorText = err;
        }

        for (const [field, name] of required) {
            const [ok, err] = is_empty(field.value, name);
            if (!ok) {
                errors = true;
                field.style.borderColor = "red";
                if (!errorText) errorText = err;
            }
        }

        if (start_at?.value && this.serverTime) {
            const [ok, err] = validate_start_date(this.serverTime.toISOString(), start_at.value);
            if (!ok) { errors = true; start_at.style.borderColor = "red"; if (!errorText) errorText = err; }
        }

        if (end_at?.value && start_at?.value) {
            const [ok, err] = validate_end_date(start_at.value, end_at.value);
            if (!ok) { errors = true; end_at.style.borderColor = "red"; if (!errorText) errorText = err; }
        }

        error_message.innerText = errorText;
        return errors;
    }

    /**
     * Обработчик события submit формы.
     * @async
     * @param {Event} e
     * @returns {Promise<void>}
     */
    async submit(e: Event): Promise<void> {
        e.preventDefault();
        const form = this.getElement();
        if (!form) return;

        const fields: BudgetFormFields = {
            title: form.querySelector("#title_input"),
            description: form.querySelector("#description_input"),
            target: form.querySelector("#target_input"),
            category: Array.from(form.querySelectorAll<HTMLInputElement>(".custom-checkbox__input")).filter((elem: HTMLInputElement): boolean => elem.checked),
            start_at: form.querySelector("#start_at_input"),
            end_at: form.querySelector("#end_at_input"),
        };
        const error_message = form.querySelector<HTMLElement>("#error_message")!;

        if (this.validate(fields, error_message)) return;

        let selected_categories: string[] = [];
        if (fields.category) {
            fields.category.forEach((checkbox: HTMLInputElement) => {
                if (checkbox.checked && checkbox.value) {
                    selected_categories.push(checkbox.value);
                }
            });
        }

        const payload = {
            title: fields.title!.value,
            description: fields.description!.value,
            target: parseInt(fields.target!.value, 10),
            currency: "RUB",
            category: selected_categories,
            start_at: fields.start_at!.value ? new Date(fields.start_at!.value).toISOString() : null,
            end_at: fields.end_at!.value ? new Date(fields.end_at!.value).toISOString() : null,
        };

        const submitBtn = form.querySelector<HTMLButtonElement>("button[type='submit']");
        if (submitBtn) submitBtn.disabled = true;

        try {
            const response = await client("/api/budget", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                router.refresh();
            } else {
                const data = await response.json().catch(() => ({}));
                error_message.innerText = data.message || "Не удалось сохранить бюджет";
            }
        } catch {
            error_message.innerText = "Сервер недоступен";
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }
}