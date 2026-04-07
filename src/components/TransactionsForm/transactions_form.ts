import { BaseComponent } from "../base_component";
import { createTransaction } from "../../api/transactions";
import { fetchAccountId } from "../../api/accounts";
// @ts-ignore
import template from "./transactions_form.hbs?raw";
import "./transactions_form.scss";
import { router } from "../../router/router_instance";
import { CustomCalendar } from "../CustomCalendar/custom_calendar";
import { CustomSelect } from "../CustomSelect/custom_select";
import { get_categories, get_currencies } from "../../store/store";
import { validate_transaction_value, validate_transaction_date } from "../../utils/validation";
import type { TransactionCreateRequest } from "../../types/interfaces";
import {clean_data} from "../../utils/xss.ts";

/**
 * Данные для инициализации формы в режиме редактирования.
 * @interface TransactionFormData
 */
interface TransactionFormData {
    account_id: number;
    value: number;
    type: string;
    category: string;
    currency: string;
    title: string;
    description: string;
    transaction_date: string;
}

/**
 * Поля формы транзакции для валидации.
 * @interface TransactionFormFields
 */
interface TransactionFormFields {
    title: HTMLInputElement | null;
    value: HTMLInputElement | null;
    currency: HTMLInputElement | null;
    type: HTMLInputElement | null;
    category: HTMLInputElement | null;
    transaction_date: HTMLInputElement | null;
    description: HTMLTextAreaElement | null;
}

/**
 * Компонент формы создания/редактирования транзакции.
 * @class TransactionForm
 * @extends BaseComponent
 */
export class TransactionForm extends BaseComponent {
    private _dateCal: CustomCalendar | null = null;
    private _typeSelect: CustomSelect | null = null;
    private _categorySelect: CustomSelect | null = null;
    private _currencySelect: CustomSelect | null = null;
    private _initialData: TransactionFormData | null = null;
    private _onSubmitCallback: ((data: TransactionCreateRequest) => Promise<void>) | null = null;

    /**
     * Создаёт экземпляр формы транзакции.
     * @constructor
     * @param {TransactionFormData | null} [initialData] - Данные для режима редактирования
     * @param {(data: TransactionCreateRequest) => Promise<void>} [onSubmit] - Callback при успешной отправке
     */
    constructor(initialData?: TransactionFormData | null, onSubmit?: (data: TransactionCreateRequest) => Promise<void>) {
        super(template, { mode: initialData ? "edit" : "" });
        this._initialData = initialData || null;
        this._onSubmitCallback = onSubmit || null;
    }

    /**
     * Инициализирует компоненты после рендера шаблона.
     * @protected
     * @async
     * @returns {Promise<void>}
     */
    protected async _afterRender(): Promise<void> {
        await this._initComponents();
    }

    /**
     * Инициализирует все компоненты формы: селекты, календарь, заполнение данных.
     * @private
     * @async
     * @returns {Promise<void>}
     */
    private async _initComponents(): Promise<void> {
        const form = this.getElement();
        if (!form) return;

        this._populateCategories(form);
        this._populateCurrencies(form);
        this._initSelects(form);
        this._initCalendar(form);

        // Если это создание новой транзакции (нет initialData), ставим RUB по умолчанию
        if (!this._initialData) {
            const currencyInput = form.querySelector<HTMLInputElement>("#currency_input");
            const currencyDisplay = form.querySelector<HTMLElement>("#currency_display");
            if (currencyInput && currencyDisplay) {
                currencyInput.value = "RUB";
                currencyDisplay.innerText = "RUB";
            }
        } else {
            this._fillFormData(this._initialData);
        }
    }

    /**
     * Регистрирует обработчики событий формы.
     * @protected
     */
    protected _addEventListeners(): void {
        const form = this.getElement();
        if (!form) return;

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
                input.classList.remove("transactions-form__input--invalid");
                const display = form.querySelector<HTMLElement>(`#${input.id.replace("_input", "_display")}`);
                display?.classList.remove("transactions-form__input--invalid");
                form.querySelector<HTMLElement>("#error_message")!.innerText = "";
            });
        });
    }

    /**
     * Заполняет поля формы начальными данными при редактировании.
     * @private
     * @param {TransactionFormData} data - Данные транзакции
     */
    
    private _fillFormData(data: TransactionFormData): void {
        const form = this.getElement();
        if (!form) return;

        const titleInput = form.querySelector<HTMLInputElement>("#title_input");
        if (titleInput) titleInput.value = data.title;

        const valueInput = form.querySelector<HTMLInputElement>("#value_input");
        if (valueInput) valueInput.value = String(data.value);

        const typeInput = form.querySelector<HTMLInputElement>("#type_input");
        const typeDisplay = form.querySelector<HTMLElement>("#type_display");
        if (typeInput && typeDisplay) {
            typeInput.value = data.type.toUpperCase();
            typeDisplay.innerText = data.type.toLowerCase() === "income" ? "Доход" : "Расход";
        }

        const categoryInput = form.querySelector<HTMLInputElement>("#category_input");
        const categoryDisplay = form.querySelector<HTMLElement>("#category_display");
        if (categoryInput && categoryDisplay) {
            categoryInput.value = data.category;
            categoryDisplay.innerText = data.category;
        }

        const currencyInput = form.querySelector<HTMLInputElement>("#currency_input");
        const currencyDisplay = form.querySelector<HTMLElement>("#currency_display");
        if (currencyInput && currencyDisplay) {
            currencyInput.value = data.currency;
            currencyDisplay.innerText = data.currency;
        }

        const dateInput = form.querySelector<HTMLInputElement>("#transaction_date_input");
        const dateDisplay = form.querySelector<HTMLInputElement>("#transaction_date_display");
        if (dateInput && dateDisplay) {
            const formattedDate = this._formatDateForDisplay(data.transaction_date);
            dateDisplay.value = formattedDate;

            const d = new Date(data.transaction_date);
            const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            dateInput.value = isoDate;
        }

        const descriptionInput = form.querySelector<HTMLTextAreaElement>("#description_input");
        if (descriptionInput) descriptionInput.value = data.description;
    }

    /**
     * Форматирует дату из ISO-строки в формат ДД.ММ.ГГГГ для отображения.
     * @private
     * @param {string} dateString - Дата в формате ISO
     * @returns {string} Дата в формате ДД.ММ.ГГГГ
     */
    private _formatDateForDisplay(dateString: string): string {
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        } catch {
            return dateString;
        }
    }

    /**
     * Заполняет дропдаун категорий из store.
     * @private
     * @param {Element} form - Элемент формы
     */
    private _populateCategories(form: Element): void {
        const dropdown = form.querySelector<HTMLElement>("#category_dropdown")!;
        const categories = get_categories();
        if (categories.length === 0) {
            dropdown.innerHTML = `<div class="custom-select__option" style="opacity:0.4;cursor:default">Категории не загружены</div>`;
            return;
        }
        dropdown.innerHTML = categories
            .map(c => `<div class="custom-select__option" data-value="${c}">${c}</div>`)
            .join("");
    }

    /**
     * Заполняет дропдаун валют из store.
     * @private
     * @param {Element} form - Элемент формы
     */
    private _populateCurrencies(form: Element): void {
        const dropdown = form.querySelector<HTMLElement>("#currency_dropdown")!;
        const currencies = get_currencies();
        if (currencies.length === 0) {
            dropdown.innerHTML = `<div class="custom-select__option" style="opacity:0.4;cursor:default">Валюты не загружены</div>`;
            return;
        }
        dropdown.innerHTML = currencies
            .map(c => `<div class="custom-select__option" data-value="${c}">${c}</div>`)
            .join("");
    }

    /**
     * Инициализирует все CustomSelect после заполнения дропдаунов.
     * @private
     * @param {Element} form - Элемент формы
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
     * Инициализирует CustomCalendar с ограничением ±5 лет от текущей даты.
     * @private
     * @param {Element} form - Элемент формы
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
     * Выполняет валидацию полей формы.
     * @private
     * @param {TransactionFormFields} fields - Поля формы для валидации
     * @param {HTMLElement} error_message - Элемент для вывода ошибки
     * @returns {boolean} true если есть ошибки валидации
     */
    private validate(fields: TransactionFormFields, error_message: HTMLElement): boolean {
        for (let elem in fields) {
            let field: any = fields[elem as keyof TransactionFormFields];
            if (field)
                field.value = clean_data(field.value);
        }
        const { title, value, currency, category, transaction_date, description } = fields;
        let errors = false;
        let errorText = "";

        const form = this.getElement();
        if (!form) return true;

        [title, value, transaction_date]
            .filter((f): f is HTMLInputElement => f !== null)
            .forEach(f => f.style.borderColor = "rgba(72, 79, 255, 0.5)");
        
        if (description) description.style.borderColor = "rgba(72, 79, 255, 0.5)";
        
        const currencyDisplay = form.querySelector<HTMLElement>("#currency_display");
        const categoryDisplay = form.querySelector<HTMLElement>("#category_display");
        const dateDisplay = form.querySelector<HTMLInputElement>("#transaction_date_display");
        
        currencyDisplay?.classList.remove("transactions-form__input--invalid");
        categoryDisplay?.classList.remove("transactions-form__input--invalid");
        if (dateDisplay) dateDisplay.style.borderColor = "rgba(72, 79, 255, 0.5)";

        if (!title || !title.value.trim()) {
            errors = true;
            if (title) title.style.borderColor = "red";
            if (!errorText) errorText = "Введите название";
        } else if (title.value.trim().length > 255) {
            errors = true;
            title.style.borderColor = "red";
            if (!errorText) errorText = "Название не должно превышать 255 символов";
        }

        if (!value || !value.value) {
            errors = true;
            if (value) value.style.borderColor = "red";
            if (!errorText) errorText = "Введите сумму";
        } else {
            const [valueOk, valueErr] = validate_transaction_value(value.value);
            if (!valueOk) {
                errors = true;
                value.style.borderColor = "red";
                if (!errorText) errorText = valueErr;
            }
        }

        if (!currency || !currency.value) {
            errors = true;
            currencyDisplay?.classList.add("transactions-form__input--invalid");
            if (!errorText) errorText = "Выберите валюту";
        }

        if (!category || !category.value) {
            errors = true;
            categoryDisplay?.classList.add("transactions-form__input--invalid");
            if (!errorText) errorText = "Выберите категорию";
        }

        if (!transaction_date || !transaction_date.value) {
            errors = true;
            if (dateDisplay) dateDisplay.style.borderColor = "red";
            if (!errorText) errorText = "Выберите дату операции";
        } else {
            const [dateOk, dateErr] = validate_transaction_date(transaction_date.value);
            if (!dateOk) {
                errors = true;
                if (dateDisplay) dateDisplay.style.borderColor = "red";
                if (!errorText) errorText = dateErr;
            }
        }

        if (!description || !description.value.trim()) {
            errors = true;
            if (description) description.style.borderColor = "red";
            if (!errorText) errorText = "Введите описание";
        }

        error_message.innerText = errorText;
        return errors;
    }

    /**
     * Подсвечивает поля красным на основе ошибок валидации от сервера.
     * @public
     * @param {Array<{ field: string; message: string }>} errors - Массив ошибок с полями
     */
    markFieldsInvalid(errors: Array<{ field: string; message: string }>): void {
        const form = this.getElement();
        if (!form) return;

        this._clearValidationErrors();

        const fieldMap: Record<string, string> = {
            "title": "#title_input",
            "value": "#value_input",
            "type": "#type_input",
            "currency": "#currency_input",
            "category": "#category_input",
            "transaction_date": "#transaction_date_input",
            "description": "#description_input",
        };

        errors.forEach((err) => {
            const selector = fieldMap[err.field];
            if (selector) {
                const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
                if (input) {
                    input.style.borderColor = "red";
                    input.classList.add("transactions-form__input--invalid");
                }
                
                const displaySelector = selector.replace("_input", "_display");
                const displayEl = form.querySelector<HTMLElement>(displaySelector);
                if (displayEl) {
                    displayEl.classList.add("transactions-form__input--invalid");
                }
            }
        });
    }

    /**
     * Очищает все ошибки валидации из формы.
     * @private
     */
    private _clearValidationErrors(): void {
        const form = this.getElement();
        if (!form) return;

        const inputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
        inputs.forEach(input => {
            input.style.borderColor = "";
            input.classList.remove("transactions-form__input--invalid");
        });

        const categoryDisplay = form.querySelector<HTMLElement>("#category_display");
        const currencyDisplay = form.querySelector<HTMLElement>("#currency_display");
        categoryDisplay?.classList.remove("transactions-form__input--invalid");
        currencyDisplay?.classList.remove("transactions-form__input--invalid");
    }

    /**
     * Обработчик события submit формы.
     * @private
     * @async
     * @param {Event} e - Событие отправки формы
     * @returns {Promise<void>}
     */
    private async _submit(e: Event): Promise<void> {
        e.preventDefault();
        const form = this.getElement();
        if (!form) return;

        const fields: TransactionFormFields = {
            title: form.querySelector("#title_input"),
            value: form.querySelector("#value_input"),
            currency: form.querySelector("#currency_input"),
            type: form.querySelector("#type_input"),
            category: form.querySelector("#category_input"),
            transaction_date: form.querySelector("#transaction_date_input"),
            description: form.querySelector("#description_input"),
        };
        
        const error_message = form.querySelector<HTMLElement>("#error_message")!;

        if (this.validate(fields, error_message)) return;

        const submitBtn = form.querySelector<HTMLButtonElement>("button[type='submit']");
        if (submitBtn) submitBtn.disabled = true;

        try {
            const accountId = await fetchAccountId();

            const payload: TransactionCreateRequest = {
                account_id: accountId,
                value: parseFloat(fields.value!.value),
                type: fields.type!.value,
                category: fields.category!.value,
                currency: fields.currency!.value,
                title: fields.title!.value.trim(),
                description: fields.description!.value.trim(),
                transaction_date: new Date(fields.transaction_date!.value).toISOString(),
            };

            if (this._onSubmitCallback) {
                await this._onSubmitCallback(payload);
            } else {
                const id = await createTransaction(payload);
                if (id !== null) {
                    router.navigate("/operations");
                } else {
                    error_message.innerText = "Не удалось создать транзакцию";
                }
            }
        } catch {
            error_message.innerText = "Сервер недоступен";
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    }
}