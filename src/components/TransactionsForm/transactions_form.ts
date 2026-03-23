import { BaseComponent } from "../base_component";
import { createTransaction } from "../../api/transactions.ts";
import { fetchAccountId } from "../../api/accounts.ts";
// @ts-ignore
import template from "./transactions_form.hbs?raw";
import "./transactions_form.css";
import { router } from "../../router/router_instance";
import { CustomCalendar } from "../CustomCalendar/custom_calendar";
import { CustomSelect } from "../CustomSelect/custom_select";
import { get_categories, get_currencies } from "../../store/store";
import { validate_transaction_value, validate_transaction_date } from "../../utils/validation";

/**
 * Компонент формы создания транзакции.
 * @class TransactionForm
 * @extends BaseComponent
 */
export class TransactionForm extends BaseComponent {
    private _dateCal: CustomCalendar | null = null;
    private _typeSelect: CustomSelect | null = null;
    private _categorySelect: CustomSelect | null = null;
    private _currencySelect: CustomSelect | null = null;

    constructor() {
        super(template, {});
    }

    protected _addEventListeners(): void {
        const form = this.getElement();
        if (!form) return;

        this._populateCategories(form);
        this._populateCurrencies(form);
        this._initSelects(form);
        this._initCalendar(form);

        this._on(form, "submit", (e) => this._submit(e));
        this._on(form.querySelector("#cancel_btn")!, "click", () => router.navigate("/operations"));

        document.addEventListener("click", () => {
            this._dateCal?.close();
            this._typeSelect?.close();
            this._categorySelect?.close();
            this._currencySelect?.close();
        });

        form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input:not([type='hidden']), textarea").forEach(input => {
                input.addEventListener("input", () => {
                input.style.borderColor = "";
                form.querySelector<HTMLElement>("#error_message")!.innerText = "";
            });
        });
    }

    /**
     * Заполняет дропдаун категорий из store.
     * @private
     * @param {Element} form
     */
    private _populateCategories(form: Element): void {
        const dropdown = form.querySelector<HTMLElement>("#category_dropdown")!;
        const categories = get_categories();
        if (categories.length === 0) {
            dropdown.innerHTML = `<div class="custom-select__option custom-select__option--empty">Категории не загружены</div>`;
            return;
        }
        dropdown.innerHTML = categories
            .map(c => `<div class="custom-select__option" data-value="${c}">${c}</div>`)
            .join("");
    }

    /**
     * Заполняет дропдаун валют из store.
     * @private
     * @param {Element} form
     */
    private _populateCurrencies(form: Element): void {
        const dropdown = form.querySelector<HTMLElement>("#currency_dropdown")!;
        const currencies = get_currencies();
        if (currencies.length === 0) {
            dropdown.innerHTML = `<div class="custom-select__option custom-select__option--empty">Валюты не загружены</div>`;
            return;
        }
        dropdown.innerHTML = currencies
            .map(c => `<div class="custom-select__option" data-value="${c}">${c}</div>`)
            .join("");
    }

    /**
     * Инициализирует все CustomSelect после заполнения дропдаунов.
     * @private
     * @param {Element} form
     */
    private _initSelects(form: Element): void {
        this._typeSelect = new CustomSelect(
            form.querySelector<HTMLElement>("#type_display")!,
            form.querySelector<HTMLInputElement>("#type_input")!,
            form.querySelector<HTMLElement>("#type_dropdown")!,
        );

        if (get_categories().length > 0) {
            this._categorySelect = new CustomSelect(
                form.querySelector<HTMLElement>("#category_display")!,
                form.querySelector<HTMLInputElement>("#category_input")!,
                form.querySelector<HTMLElement>("#category_dropdown")!,
            );
        }

        if (get_currencies().length > 0) {
            this._currencySelect = new CustomSelect(
                form.querySelector<HTMLElement>("#currency_display")!,
                form.querySelector<HTMLInputElement>("#currency_input")!,
                form.querySelector<HTMLElement>("#currency_dropdown")!,
            );
        }
    }

    /**
     * Инициализирует CustomCalendar с ограничением ±5 лет.
     * @private
     * @param {Element} form
     */
    private _initCalendar(form: Element): void {
        const popup = form.querySelector<HTMLElement>("#transaction_date_calendar")!;
        const display = form.querySelector<HTMLInputElement>("#transaction_date_display")!;
        const input = form.querySelector<HTMLInputElement>("#transaction_date_input")!;
        const btn = form.querySelector<HTMLElement>("#transaction_date_btn")!;

        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 5);
        minDate.setHours(0, 0, 0, 0);

        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 5);
        maxDate.setHours(0, 0, 0, 0);

        this._dateCal = new CustomCalendar(popup, display, input, minDate);
        this._dateCal.setMaxDate(maxDate);

        const toggle = (e: Event) => {
            e.stopPropagation();
            this._typeSelect?.close();
            this._categorySelect?.close();
            this._currencySelect?.close();
            this._dateCal?.toggle();
        };
        this._on(btn, "click", toggle);
        this._on(display, "click", toggle);
    }

    /**
     * Валидирует поля формы. Возвращает true если есть ошибки.
     * @private
     * @param {Element} form
     * @param {HTMLElement} errorEl
     * @returns {boolean}
     */
    private _validate(form: Element, errorEl: HTMLElement): boolean {
        const title = form.querySelector<HTMLInputElement>("#title_input")!;
        const value = form.querySelector<HTMLInputElement>("#value_input")!;
        const category = form.querySelector<HTMLInputElement>("#category_input")!;
        const categoryDisplay = form.querySelector<HTMLElement>("#category_display")!;
        const currency = form.querySelector<HTMLInputElement>("#currency_input")!;
        const currencyDisplay = form.querySelector<HTMLElement>("#currency_display")!;
        const date = form.querySelector<HTMLInputElement>("#transaction_date_input")!;
        const dateDisplay = form.querySelector<HTMLInputElement>("#transaction_date_display")!;
        const description = form.querySelector<HTMLTextAreaElement>("#description_input")!;

        [title, value, description, dateDisplay].forEach(f => (f.style.borderColor = ""));
        categoryDisplay.classList.remove("custom-select__display--error");
        currencyDisplay.classList.remove("custom-select__display--error");
        errorEl.innerText = "";

        let error = "";

        if (!title.value.trim()) {
            title.style.borderColor = "red";
            error ||= "Введите название";
        } else if (title.value.trim().length > 255) {
            title.style.borderColor = "red";
            error ||= "Название не должно превышать 255 символов";
        }

        const [valueOk, valueErr] = validate_transaction_value(value.value);
        if (!valueOk) {
            value.style.borderColor = "red";
            error ||= valueErr;
        }

        if (!currency.value) {
            currencyDisplay.classList.add("custom-select__display--error");
            error ||= "Выберите валюту";
        }

        if (!category.value) {
            categoryDisplay.classList.add("custom-select__display--error");
            error ||= "Выберите категорию";
        }

        if (!date.value) {
            dateDisplay.style.borderColor = "red";
            error ||= "Выберите дату операции";
        } else {
            const [dateOk, dateErr] = validate_transaction_date(date.value);
            if (!dateOk) {
                dateDisplay.style.borderColor = "red";
                error ||= dateErr;
            }
        }

        if (!description.value.trim()) {
            description.style.borderColor = "red";
            error ||= "Введите описание";
        }

        if (error) errorEl.innerText = error;
        return !!error;
    }

    /**
     * Обработчик отправки формы: получает account_id с сервера, затем POST /transactions.
     * @private
     * @param {Event} e
     */
    private async _submit(e: Event): Promise<void> {
        e.preventDefault();
        const form = this.getElement();
        if (!form) return;

        const errorEl = form.querySelector<HTMLElement>("#error_message")!;
        if (this._validate(form, errorEl)) return;

        const submitBtn = form.querySelector<HTMLButtonElement>("button[type='submit']");
        if (submitBtn) submitBtn.disabled = true;

        try {
            const accountId = await fetchAccountId();

            const payload = {
                account_id: accountId,
                value: parseFloat(form.querySelector<HTMLInputElement>("#value_input")!.value),
                type: form.querySelector<HTMLInputElement>("#type_input")!.value,
                category: form.querySelector<HTMLInputElement>("#category_input")!.value,
                title: form.querySelector<HTMLInputElement>("#title_input")!.value.trim(),
                description: form.querySelector<HTMLTextAreaElement>("#description_input")!.value.trim(),
                transaction_date: new Date(
                    form.querySelector<HTMLInputElement>("#transaction_date_input")!.value
                ).toISOString(),
            };

            const id = await createTransaction(payload);
            if (id !== null) {
                router.navigate("/operations");
            } else {
                errorEl.innerText = "Не удалось создать транзакцию";
            }
        } catch {
            errorEl.innerText = "Сервер недоступен";
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }
}