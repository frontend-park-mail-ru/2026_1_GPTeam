import { BaseComponent } from "../base_component.js";
import template from "./budget_form.hbs?raw";
import "./budget_form.css";
import { router } from "../../router/router_instance.js";
import { client } from "../../api/client.js";

export class BudgetForm extends BaseComponent {
  constructor(props) {
    super(template, props);
    this.serverTime = null;
  }

  async _afterRender() {
    await this._fetchServerTime();
  }

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
    }

    if (currency && currency.value) {
      if (!/^[a-zA-Z]+$/.test(currency.value)) {
        errors = true;
        currency.style.borderColor = "red";
        if (!errorText) errorText = "Валюта должна содержать только латинские буквы";
      }
    }

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
        }
        error_message.innerText = data.message || "Произошла ошибка";
      }
    } catch (err) {
      console.error("Fetch error:", err);
      error_message.innerText = "Сервер недоступен";
    } finally {
      submit_input.disabled = false;
    }
  }
}
