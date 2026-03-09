import {BaseComponent} from "../base_component.js";
import template from "./budget_form.hbs?raw";
import "./budget_form.css";
import {router} from "../../router/router_instance.js";
import {client} from "../../api/client.js";
import {
    is_empty,
    validate_currency,
    validate_end_date,
    validate_start_date,
    validate_target_budget
} from "../../utils/validation.js";
import {currencies} from "../../store/store.js";

/**
 * Компонент формы создания или редактирования бюджета.
 * Отвечает за сбор данных, сложную валидацию дат относительно серверного времени
 * и отправку данных на сервер.
 * * @class BudgetForm
 * @extends BaseComponent
 */
export class BudgetForm extends BaseComponent {
<<<<<<< HEAD
    constructor(props) {
        props.currency_list = currencies;
        super(template, props);
        this.serverTime = null;
=======
  /**
   * Создает экземпляр формы бюджета.
   * @param {Object} props - Свойства компонента.
   */
  constructor(props) {
    super(template, props);
    /** * Текущее время сервера. Используется для валидации, чтобы пользователь 
     * не мог создать бюджет в прошлом относительно сервера.
     * @type {Date|null} 
     */
    this.serverTime = null;
  }

  /**
   * Выполняется после первичного рендеринга компонента.
   * Инициирует запрос серверного времени.
   * @async
   * @private
   */
  async _afterRender() {
    await this._fetchServerTime();
  }

  /**
   * Запрашивает текущую дату с сервера через заголовки ответа.
   * Если заголовок 'date' отсутствует, использует системное время клиента.
   * @async
   * @private
   */
  async _fetchServerTime() {
    try {
      const response = await client("/get_budgets", {
        method: "GET",
        credentials: "include",
      });
      const dateHeader = response.headers.get("date");
      if (dateHeader) {
        this.serverTime = new Date(dateHeader);
      } else {
        this.serverTime = new Date();
      }
    } catch (err) {
      console.error("Failed to fetch server time:", err);
      this.serverTime = new Date();
    }
  }

  /**
   * Выполняет валидацию полей ввода.
   * Проверяет обязательность заполнения, формат валюты (латиница), 
   * положительность суммы и хронологическую последовательность дат.
   * * @param {Object} fields - Объект с DOM-элементами полей формы.
   * @param {HTMLElement} error_message - Элемент для вывода текста ошибки.
   * @returns {boolean} true, если найдены ошибки, иначе false.
   */
  validate(fields, error_message) {
    const { title, target, currency, start_at, end_at } = fields;
    let errors = false;
    let errorText = "";

    [title, target, currency, start_at, end_at].filter(f => f).forEach(f => f.style.borderColor = "rgba(72, 79, 255, 0.5)");

    const requiredFields = [
      [title, "Название"],
      [target, "Планируемый бюджет"],
      [currency, "Валюта"],
      [start_at, "Дата начала"],
      [end_at, "Дата окончания"],
    ];

    for (const [field, name] of requiredFields) {
      if (!field || !field.value) {
        errors = true;
        if (field) field.style.borderColor = "red";
        if (!errorText) errorText = `${name} обязательно для заполнения`;
      }
>>>>>>> 3e902a2 (added linter and done linter fixes, added email validation, added full jsdoc, added labels)
    }

    async _afterRender() {
        await this._fetchServerTime();
    }

<<<<<<< HEAD
    async _fetchServerTime() {
        try {
            const response = await client("/get_budgets", {
                method: "GET",
                credentials: "include",
            });
            const dateHeader = response.headers.get("date");
            if (dateHeader) {
                this.serverTime = new Date(dateHeader);
            } else {
                this.serverTime = new Date();
            }
        } catch (err) {
            console.error("Failed to fetch server time:", err);
            this.serverTime = new Date();
        }
    }

    validate(fields, error_message) {
        const {title, description, target, currency, start_at, end_at} = fields;
        let errors = false;
        let errorText = "";

        [title, description, target, currency, start_at, end_at].filter(f => f).forEach(f => f.style.borderColor = "rgba(72, 79, 255, 0.5)");

        const requiredFields = [
            [title, "Название"],
            [description, "Описание"],
            [target, "Планируемый бюджет"],
            [currency, "Валюта"],
            [start_at, "Дата начала"],
            // [end_at, "Дата окончания"],
        ];

        for (const [field, name] of requiredFields) {
            let [ok, error] = is_empty(field.value, name);
            if (!ok) {
                errors = true;
                if (field) field.style.borderColor = "red";
                if (!errorText) errorText = error;
            }
        }

        if (currency && currency.value) {
            let [ok, error] = validate_currency(currency.value);
            if (!ok) {
                errors = true;
                currency.style.borderColor = "red";
                if (!errorText) errorText = error;
            }
        }

        if (target && target.value) {
            let [ok, error] = validate_target_budget(target.value);
            if (!ok) {
                errors = true;
                target.style.borderColor = "red";
                if (!errorText) errorText = error;
                console.log(error)
            }
        }

        if (start_at && start_at.value) {
            let [ok, error] = validate_start_date(this.serverTime, start_at.value);
            if (!ok) {
                errors = true;
                start_at.style.borderColor = "red";
                if (!errorText) errorText = error;
            }
        }

        if (end_at && end_at.value && start_at && start_at.value) {
            let [ok, error] = validate_end_date(start_at.value, end_at.value);
            if (!ok) {
                errors = true;
                end_at.style.borderColor = "red";
                if (!errorText) errorText = error;
            }
        }

        error_message.innerText = errorText;
        return errors;
    }

    async submit(e) {
        e.preventDefault();
        const form = this.getElement();
        const submit_input = form.querySelector("input[type='submit']");
        const title = form.querySelector("#title_input");
        const description = form.querySelector("#description_input");
        const target = form.querySelector("#target_input");
        const currency = form.querySelector("#currency_input");
        const start_at = form.querySelector("#start_at_input");
        const end_at = form.querySelector("#end_at_input");
        const error_message = form.querySelector("#error_message");

        const hasErrors = this.validate({title, description, target, currency, start_at, end_at}, error_message);
        if (hasErrors) return;

        const payload = {
            title: title.value,
            description: description.value,
            target: parseInt(target.value, 10),
            currency: currency.value,
            start_at: start_at.value ? new Date(start_at.value).toISOString() : null,
            end_at: end_at.value ? new Date(end_at.value).toISOString() : null,
        };

        submit_input.disabled = true;
        try {
            const response = await client("/budget", {
                method: "POST",
                credentials: "include",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (data.code === 200) {
                router.refresh();
            } else {
                if (data.errors && Array.isArray(data.errors)) {
                    data.errors.forEach(err => {
                        if (err.field === "title") title.style.borderColor = "red";
                        if (err.field === "target") target.style.borderColor = "red";
                        if (err.field === "currency") currency.style.borderColor = "red";
                    });
                }
                error_message.innerText = data.message || "Произошла ошибка";
            }
        } catch (err) {
            console.error("Fetch error:", err);
            error_message.innerText = "Сервер недоступен";
        } finally {
            submit_input.disabled = false;
=======
    if (target && target.value) {
      const targetNum = parseInt(target.value, 10);
      if (isNaN(targetNum) || targetNum <= 0) {
        errors = true;
        target.style.borderColor = "red";
        if (!errorText) errorText = "Бюджет должен быть положительным числом";
      }
    }

    if (start_at && start_at.value) {
      const startDate = new Date(start_at.value);
      if (this.serverTime && startDate < this.serverTime) {
        errors = true;
        start_at.style.borderColor = "red";
        if (!errorText) errorText = "Дата начала не может быть в прошлом";
      }
    }

    if (end_at && end_at.value && start_at && start_at.value) {
      const startDate = new Date(start_at.value);
      const endDate = new Date(end_at.value);
      if (endDate < startDate) {
        errors = true;
        end_at.style.borderColor = "red";
        if (!errorText) errorText = "Дата окончания должна быть позже даты начала";
      }
    }

    error_message.innerText = errorText;
    return errors;
  }

  /**
   * Обработчик события submit формы.
   * Проводит валидацию, формирует JSON-полезную нагрузку (преобразуя даты в ISO формат)
   * и отправляет POST запрос на /budget.
   * * @async
   * @param {Event} e - Объект события.
   * @returns {Promise<void>}
   */
  async submit(e) {
    e.preventDefault();
    const form = this.getElement();
    const submit_input = form.querySelector("input[type='submit']");
    const title = form.querySelector("#title_input");
    const description = form.querySelector("#description_input");
    const target = form.querySelector("#target_input");
    const currency = form.querySelector("#currency_input");
    const start_at = form.querySelector("#start_at_input");
    const end_at = form.querySelector("#end_at_input");
    const error_message = form.querySelector("#error_message");

    const hasErrors = this.validate({ title, target, currency, start_at, end_at }, error_message);
    if (hasErrors) return;

    const payload = {
      title: title.value,
      description: description.value,
      target: parseInt(target.value, 10),
      currency: currency.value,
      start_at: start_at.value ? new Date(start_at.value).toISOString() : null,
      end_at: end_at.value ? new Date(end_at.value).toISOString() : null,
    };

    submit_input.disabled = true;
    try {
      const response = await client("/budget", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.code === 200) {
        router.refresh();
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(err => {
            if (err.field === "title") title.style.borderColor = "red";
            if (err.field === "target") target.style.borderColor = "red";
            if (err.field === "currency") currency.style.borderColor = "red";
          });
>>>>>>> 3e902a2 (added linter and done linter fixes, added email validation, added full jsdoc, added labels)
        }
    }
<<<<<<< HEAD
}
=======
  }
}
>>>>>>> 3e902a2 (added linter and done linter fixes, added email validation, added full jsdoc, added labels)
