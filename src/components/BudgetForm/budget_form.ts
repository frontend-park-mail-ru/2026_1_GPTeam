import { BaseComponent } from "../base_component.js";
import template from "./budget_form.hbs?raw";
import "./budget_form.css";
import { router } from "../../router/router_instance.js";
import { client } from "../../api/client.js";
import { currencies } from "../../store/store.js";
import type {
  FieldError,
  BudgetResponse as BudgetResponseType,
  BudgetCreateResponse
} from "../../types/interfaces.js";
import {
  is_empty,
  validate_currency,
  validate_end_date,
  validate_start_date,
  validate_target_budget
} from "../../utils/validation.js";

interface BudgetFormProps extends Record<string, unknown> {
  currency_list?: string[];
}

interface BudgetFormFields {
  title: HTMLInputElement | null;
  description: HTMLInputElement | null;
  target: HTMLInputElement | null;
  currency: HTMLInputElement | null;
  start_at: HTMLInputElement | null;
  end_at: HTMLInputElement | null;
}

/**
 * Компонент формы создания или редактирования бюджета.
 * Отвечает за сбор данных, сложную валидацию дат относительно серверного времени
 * и отправку данных на сервер.
 * @class BudgetForm
 * @extends BaseComponent
 */
export class BudgetForm extends BaseComponent {
  /**
   * Текущее время сервера. Используется для валидации, чтобы пользователь
   * не мог создать бюджет в прошлом относительно сервера.
   * @type {Date | null}
   */
  private serverTime: Date | null;

  /**
   * Создает экземпляр формы бюджета.
   * @param {BudgetFormProps} props - Свойства компонента.
   */
  constructor(props: BudgetFormProps) {
    props.currency_list = currencies;
    super(template, props);
    this.serverTime = null;
  }

  /**
   * Выполняется после первичного рендеринга компонента.
   * Инициирует запрос серверного времени.
   * @async
   * @protected
   */
  protected async _afterRender(): Promise<void> {
    await this._fetchServerTime();
  }

  /**
   * Запрашивает текущую дату с сервера через заголовки ответа.
   * Если заголовок 'date' отсутствует, использует системное время клиента.
   * @async
   * @private
   */
  private async _fetchServerTime(): Promise<void> {
    try {
      const response = await client("/get_budgets", {
        method: "GET",
        credentials: "include",
      });
      const dateHeader = response.headers.get("date");
      this.serverTime = dateHeader ? new Date(dateHeader) : new Date();
    } catch (err) {
      console.error("Failed to fetch server time:", err);
      this.serverTime = new Date();
    }
  }

  /**
   * Выполняет валидацию полей ввода.
   * Проверяет обязательность заполнения, формат валюты,
   * положительность суммы и хронологическую последовательность дат.
   * @param {BudgetFormFields} fields - Объект с DOM-элементами полей формы.
   * @param {HTMLElement} error_message - Элемент для вывода текста ошибки.
   * @returns {boolean} true, если найдены ошибки, иначе false.
   */
  validate(fields: BudgetFormFields, error_message: HTMLElement): boolean {
    const { title, description, target, currency, start_at, end_at } = fields;
    let errors = false;
    let errorText = "";
    [title, description, target, currency, start_at, end_at]
      .filter((f): f is HTMLInputElement => f !== null)
      .forEach(f => f.style.borderColor = "rgba(72, 79, 255, 0.5)");
    const requiredFields: [HTMLInputElement, string][] = [
      [title!, "Название"],
      [description!, "Описание"],
      [target!, "Планируемый бюджет"],
      [currency!, "Валюта"],
      [start_at!, "Дата начала"],
    ];
    for (const [field, name] of requiredFields) {
      const [ok, error] = is_empty(field.value, name);
      if (!ok) {
        errors = true;
        field.style.borderColor = "red";
        if (!errorText) errorText = error;
      }
    }
    if (currency?.value) {
      const [ok, error] = validate_currency(currency.value);
      if (!ok) {
        errors = true;
        currency.style.borderColor = "red";
        if (!errorText) errorText = error;
      }
    }
    if (target?.value) {
      const [ok, error] = validate_target_budget(target.value);
      if (!ok) {
        errors = true;
        target.style.borderColor = "red";
        if (!errorText) errorText = error;
        console.log(error);
      }
    }
    if (start_at?.value) {
      const [ok, error] = validate_start_date(this.serverTime!.toISOString(), start_at.value);
      if (!ok) {
        errors = true;
        start_at.style.borderColor = "red";
        if (!errorText) errorText = error;
      }
    }
    if (end_at?.value && start_at?.value) {
      const [ok, error] = validate_end_date(start_at.value, end_at.value);
      if (!ok) {
        errors = true;
        end_at.style.borderColor = "red";
        if (!errorText) errorText = error;
      }
    }
    error_message.innerText = errorText;
    return errors;
  }

  /**
   * Обработчик события submit формы.
   * Проводит валидацию, формирует JSON-полезную нагрузку (преобразуя даты в ISO формат)
   * и отправляет POST запрос на /budget.
   * @async
   * @param {Event} e - Объект события.
   * @returns {Promise<void>}
   */
  async submit(e: Event): Promise<void> {
    e.preventDefault();
    const form = this.getElement();
    if (!form) return;
    const submit_btn = form.querySelector<HTMLButtonElement>("button[type='submit']");
    const title = form.querySelector<HTMLInputElement>("#title_input");
    const description = form.querySelector<HTMLInputElement>("#description_input");
    const target = form.querySelector<HTMLInputElement>("#target_input");
    const currency = form.querySelector<HTMLInputElement>("#currency_input");
    const start_at = form.querySelector<HTMLInputElement>("#start_at_input");
    const end_at = form.querySelector<HTMLInputElement>("#end_at_input");
    const error_message = form.querySelector<HTMLElement>("#error_message");
    if (!error_message) return;
    const hasErrors = this.validate({ title, description, target, currency, start_at, end_at }, error_message);
    if (hasErrors) return;
    const payload = {
      title: title!.value,
      description: description!.value,
      target: parseInt(target!.value, 10),
      currency: currency!.value,
      start_at: start_at!.value ? new Date(start_at!.value).toISOString() : null,
      end_at: end_at!.value ? new Date(end_at!.value).toISOString() : null,
    };
    if (submit_btn) submit_btn.disabled = true;
    try {
      const response = await client("/budget", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // Исправлено: правильное присваивание типа
      const data: BudgetResponseType = await response.json();
      if (data.code === 200) {
        router.refresh();
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(err => {
            if (err.field === "title" && title) title.style.borderColor = "red";
            if (err.field === "target" && target) target.style.borderColor = "red";
            if (err.field === "currency" && currency) currency.style.borderColor = "red";
          });
        }
        error_message.innerText = data.message ?? "Произошла ошибка";
      }
    } catch (err) {
      console.error("Fetch error:", err);
      error_message.innerText = "Сервер недоступен";
    } finally {
      if (submit_btn) submit_btn.disabled = false;
    }
  }
}