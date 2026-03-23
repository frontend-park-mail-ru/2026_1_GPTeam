type ValidationResult = [boolean, string];
import { get_currencies } from "../store/store.ts";

/**
 * Проверка логина на использование только разрешённых символов.
 * @function validate_username
 * @param {string} username
 * @returns {ValidationResult}
 */
export function validate_username(username: string): ValidationResult {
    username = username.trim();
    if (username.length < 3)
        return [false, "Логин должен быть минимум 3 символа"];
    const ok = /^[a-zA-Z0-9]+$/.test(username);
    if (!ok)
        return [false, "Логин должен содержать только буквы латинского алфавита или цифры"];
    return [true, ""];
}

/**
 * Валидирует пароль на длину и состав символов.
 * @function validate_password
 * @param {string} password
 * @returns {ValidationResult}
 */
export function validate_password(password: string): ValidationResult {
    password = password.trim();
    let has_lower = false, has_upper = false, has_digit = false, has_invalid = false;
    for (const symbol of password) {
        if ("a" <= symbol && symbol <= "z") has_lower = true;
        else if ("A" <= symbol && symbol <= "Z") has_upper = true;
        else if ("0" <= symbol && symbol <= "9") has_digit = true;
        else has_invalid = true;
    }
    if (password.length < 8 || !has_upper || !has_lower || !has_digit || has_invalid)
        return [false, "Пароль должен содержать заглавные и строчные буквы латинского алфавита и цифры (не менее 8 символов)"];
    return [true, ""];
}

/**
 * Сравнивает два пароля на идентичность.
 * @function are_password_equal
 * @param {string} password
 * @param {string} confirm_password
 * @returns {ValidationResult}
 */
export function are_password_equal(password: string, confirm_password: string): ValidationResult {
    if (password.trim() !== confirm_password.trim())
        return [false, "Пароли не совпадают"];
    return [true, ""];
}

/**
 * Проверяет поле на наличие контента.
 * @function is_empty
 * @param {string} value
 * @param {string} field_name
 * @returns {ValidationResult}
 */
export function is_empty(value: string, field_name: string): ValidationResult {
    if (value.trim().length === 0)
        return [false, `Введите ${field_name.toLowerCase()}`];
    return [true, ""];
}

/**
 * Проверка на корректность почты.
 * @function validate_email
 * @param {string} email
 * @returns {ValidationResult}
 */
export function validate_email(email: string): ValidationResult {
    email = email.trim();
    if (email.length === 0 || email.length >= 255)
        return [false, "Некорректный адрес электронной почты"];
    const ok = /^[A-Za-zа-яёА-ЯЁ0-9._%+-]+@[A-Za-zа-яёА-ЯЁ0-9.-]+\.[A-Za-zа-яёА-ЯЁ]{2,}$/.test(email);
    if (!ok)
        return [false, "Некорректный адрес электронной почты"];
    return [true, ""];
}

/**
 * Проверка на корректность валюты.
 * @function validate_currency
 * @param {string} currency
 * @returns {ValidationResult}
 */
export function validate_currency(currency: string): ValidationResult {
    currency = currency.trim().toUpperCase();
    if (get_currencies().includes(currency))
        return [true, ""];
    return [false, "Валюта не поддерживается"];
}

/**
 * Проверка на корректность введённого бюджета.
 * @function validate_target_budget
 * @param {string} target
 * @returns {ValidationResult}
 */
export function validate_target_budget(target: string): ValidationResult {
    const val = parseFloat(target.trim());
    if (isNaN(val)) return [false, "Планируемый бюджет должен быть дробным числом"];
    if (val <= 0) return [false, "Планируемый бюджет должен быть больше 0"];
    if (val > 1e12) return [false, "Планируемый бюджет слишком большой"];
    return [true, ""];
}

/**
 * Проверка суммы транзакции: больше 0 и не более 1 000 000 000.
 * @function validate_transaction_value
 * @param {string} value
 * @returns {ValidationResult}
 */
export function validate_transaction_value(value: string): ValidationResult {
    const val = parseFloat(value.trim());
    if (isNaN(val) || value.trim() === "")
        return [false, "Введите сумму операции"];
    if (val <= 0)
        return [false, "Сумма должна быть больше 0"];
    if (val > 1_000_000_000)
        return [false, "Сумма не может превышать 1 000 000 000"];
    return [true, ""];
}

/**
 * Проверка на корректность введённой даты начала бюджета.
 * @function validate_start_date
 * @param {string} server_time
 * @param {string} date_str
 * @returns {ValidationResult}
 */
export function validate_start_date(server_time: string, date_str: string): ValidationResult {
    const date = new Date(date_str.trim());
    const server_date = new Date(server_time);
    date.setHours(server_date.getHours(), server_date.getMinutes(), server_date.getSeconds(), server_date.getMilliseconds());
    if (isNaN(date.getTime())) return [false, "Некорректная дата"];
    if (date < server_date) return [false, "Дата начала не может быть в прошлом"];
    if (date.getTime() - server_date.getTime() > 5 * 365.25 * 24 * 60 * 60 * 1000)
        return [false, "Дата начала не может быть больше 5 лет от текущей даты"];
    return [true, ""];
}

/**
 * Проверка на корректность введённой даты конца бюджета.
 * @function validate_end_date
 * @param {string} start_date_str
 * @param {string} end_date_str
 * @returns {ValidationResult}
 */
export function validate_end_date(start_date_str: string, end_date_str: string): ValidationResult {
    end_date_str = end_date_str.trim();
    if (end_date_str === "") return [true, ""];
    const start_date = new Date(start_date_str.trim());
    const end_date = new Date(end_date_str);
    if (end_date < start_date) return [false, "Дата окончания должна быть позже даты начала"];
    if (end_date.getTime() - start_date.getTime() > 5 * 365.25 * 24 * 60 * 60 * 1000)
        return [false, "Период между датами не может превышать 5 лет"];
    return [true, ""];
}

/**
 * Проверка даты транзакции: не более 5 лет назад и не более 5 лет вперёд.
 * @function validate_transaction_date
 * @param {string} date_str - Дата в формате YYYY-MM-DD.
 * @returns {ValidationResult}
 */
export function validate_transaction_date(date_str: string): ValidationResult {
    date_str = date_str.trim();
    if (!date_str) return [false, "Выберите дату операции"];

    const date = new Date(date_str);
    if (isNaN(date.getTime())) return [false, "Некорректная дата"];

    const now = new Date();
    const fiveYears = 5 * 365.25 * 24 * 60 * 60 * 1000;

    if (now.getTime() - date.getTime() > fiveYears)
        return [false, "Дата не может быть раньше 5 лет назад"];
    if (date.getTime() - now.getTime() > fiveYears)
        return [false, "Дата не может быть позже 5 лет вперёд"];

    return [true, ""];
}