import { BaseComponent } from "../base_component.js";
import template from "./auth_form.hbs?raw";
import "./auth_form.css";
import "../../utils/helpers.js";
import { is_empty, validate_username, validate_password, are_password_equal, validate_email } from "../../utils/validation.js";
import { client } from "../../api/client.js";
import { router } from "../../router/router_instance.js";
import type { AuthResponse as AuthResponseType, FieldError } from "../../types/interfaces.js";

interface AuthFormProps {
  mode: "login" | "signup";
  [key: string]: unknown;
}

/**
 * Компонент формы авторизации и регистрации.
 * @class AuthForm
 * @extends BaseComponent
 */
export class AuthForm extends BaseComponent {
  private mode: "login" | "signup";

  /**
   * Создает экземпляр формы.
   * @param {AuthFormProps} props - Свойства компонента.
   */
  constructor(props: AuthFormProps) {
    super(template, props);
    this.mode = props.mode;
  }

  /**
   * Устанавливает обработчики событий для элементов формы.
   * @protected
   */
  protected _addEventListeners(): void {
    const form = this.getElement();
    if (!form) return;
    const eye_btn = form.querySelector<HTMLImageElement>(".eye_btn");
    const confirm_eye_btn = form.querySelector<HTMLImageElement>(".confirm_eye_btn");
    const help_abc = form.querySelector<HTMLElement>(".help_abc");
    const help_abc_text = form.querySelector<HTMLElement>("#help_abc_text");
    const password = form.querySelector<HTMLInputElement>("#password_input");
    const confirm_password = form.querySelector<HTMLInputElement>("#confirm_password_input");
    if (eye_btn && password) {
      this._on(eye_btn, "click", () => {
        const isVisible = password.type === "text";
        password.type = isVisible ? "password" : "text";
        eye_btn.src = isVisible ? "/img/closed_eye.png" : "/img/opened_eye.png";
      });
    }
    if (confirm_eye_btn && confirm_password) {
      this._on(confirm_eye_btn, "click", () => {
        const isVisible = confirm_password.type === "text";
        confirm_password.type = isVisible ? "password" : "text";
        confirm_eye_btn.src = isVisible ? "/img/closed_eye.png" : "/img/opened_eye.png";
      });
    }
    if (help_abc && help_abc_text) {
      this._on(help_abc, "mouseover", () => {
        help_abc_text.style.visibility = "visible";
      });
      this._on(help_abc, "mouseout", () => {
        help_abc_text.style.visibility = "hidden";
      });
    }
  }

  /**
   * Выполняет валидацию полей формы.
   * @param {{ username: HTMLInputElement | null, password: HTMLInputElement | null, confirm_password: HTMLInputElement | null, email: HTMLInputElement | null }} fields
   * @param {HTMLElement} error_message
   * @returns {boolean}
   */
  validate(
    fields: {
      username: HTMLInputElement | null;
      password: HTMLInputElement | null;
      confirm_password: HTMLInputElement | null;
      email: HTMLInputElement | null;
    },
    error_message: HTMLElement
  ): boolean {
    const { username, password, confirm_password, email } = fields;
    let errors = false;
    const mark_invalid = (input: HTMLInputElement, error: string): void => {
      errors = true;
      error_message.innerText = error;
      input.classList.add("invalid");
      input.classList.remove("valid");
    };
    const mark_valid = (input: HTMLInputElement): void => {
      input.classList.remove("invalid");
    };
    const allFields = [username, password, confirm_password, email].filter((f): f is HTMLInputElement => f !== null);
    allFields.forEach(f => f.style.borderColor = "#484FFF");
    const requiredFields: [HTMLInputElement, string][] = [
      [username!, "Логин"],
      [password!, "Пароль"],
      ...(this.mode === "signup" ? [
        [confirm_password!, "Подтверждение пароля"],
        [email!, "Email"],
      ] as [HTMLInputElement, string][] : []),
    ];
    for (const [field, name] of requiredFields) {
      mark_valid(field);
      const [ok, error] = is_empty(field.value, name);
      if (!ok)
        mark_invalid(field, error);
    }
    if (this.mode === "signup") {
      let [ok, error] = validate_username(username!.value);
      if (!ok) mark_invalid(username!, error);
      [ok, error] = validate_password(password!.value);
      if (!ok) mark_invalid(password!, error);
      [ok, error] = are_password_equal(password!.value, confirm_password!.value);
      if (!ok) mark_invalid(confirm_password!, error);
      [ok, error] = validate_email(email!.value);
      if (!ok) mark_invalid(email!, error);
    }
    return errors;
  }

  /**
   * Обработчик отправки формы.
   * @async
   * @param {Event} e - Объект события submit.
   * @returns {Promise<void>}
   */
  async submit(e: Event): Promise<void> {
    e.preventDefault();
    const form = this.getElement();
    if (!form) return;
    const submit_btn = form.querySelector<HTMLButtonElement>("button[type='submit']");
    const username = form.querySelector<HTMLInputElement>("#username_input");
    const password = form.querySelector<HTMLInputElement>("#password_input");
    const confirm_password = form.querySelector<HTMLInputElement>("#confirm_password_input");
    const email = form.querySelector<HTMLInputElement>("#email_input");
    const error_message = form.querySelector<HTMLElement>("#error_message");
    if (!error_message) return;
    const hasErrors = this.validate({ username, password, confirm_password, email }, error_message);
    if (hasErrors) return;
    const isLogin = this.mode === "login";
    const url = isLogin ? "/auth/login" : "/auth/signup";
    const payload: Record<string, string> = {
      username: username!.value,
      password: password!.value,
    };
    if (!isLogin) {
      payload.email = email!.value;
      payload.confirm_password = confirm_password!.value;
    }
    const fetchOptions: RequestInit = {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    };
    if (submit_btn) submit_btn.disabled = true;
    try {
      const response = await client(url, fetchOptions);
      const data: AuthResponseType = await response.json();
      if (data.code === 200) {
        router.navigate("/balance");
      } else if (data.code === 405) {
        console.error(data.message);
      } else {
        const mark_invalid = (input: HTMLInputElement): void => {
          input.classList.add("invalid");
          input.classList.remove("valid");
        };
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach(err => {
            if (err.field === "username" && username) mark_invalid(username);
            if (err.field === "password" && password) mark_invalid(password);
            if (err.field === "confirm_password" && confirm_password) mark_invalid(confirm_password);
            if (err.field === "email" && email) mark_invalid(email);
          });
        }
        error_message.innerText = isLogin ? "Неверный логин или пароль" : (data.message ?? "Произошла ошибка");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      error_message.innerText = "Сервер недоступен";
    } finally {
      if (submit_btn) submit_btn.disabled = false;
    }
  }
}