import { currencies } from "../store/store.js";

type ValidationResult = [boolean, string];

/**
 * Проверка логина на использование только разрешённых символов.
 * @function validate_username
 * @param {string} username - Логин.
 * @returns {ValidationResult} Кортеж: [valid, errorMessage].
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
 * @param {string} password - Пароль для проверки.
 * @returns {ValidationResult} Кортеж: [isValid, errorMessage].
 *
 * @example
 * const [isValid, error] = validate_password('123'); // [false, "Пароль должен содержать..."]
 */
export function validate_password(password: string): ValidationResult {
    password = password.trim();

    let has_lower = false;
    let has_upper = false;
    let has_digit = false;
    let has_invalid = false;

    for (const symbol of password) {
        if ("a" <= symbol && symbol <= "z")
            has_lower = true;
        else if ("A" <= symbol && symbol <= "Z")
            has_upper = true;
        else if ("0" <= symbol && symbol <= "9")
            has_digit = true;
        else
            has_invalid = true;
    }

    if (password.length < 8 || !has_upper || !has_lower || !has_digit || has_invalid)
        return [false, "Пароль должен содержать заглавные и строчные буквы латинского алфавита и цифры (не менее 8 символов)"];

    return [true, ""];
}

/**
 * Сравнивает два пароля на идентичность.
 * @function are_password_equal
 * @param {string} password - Основной пароль.
 * @param {string} confirm_password - Повторно введенный пароль.
 * @returns {ValidationResult} Кортеж: [isEqual, errorMessage].
 */
export function are_password_equal(password: string, confirm_password: string): ValidationResult {
    password = password.trim();
    confirm_password = confirm_password.trim();
    if (password !== confirm_password)
        return [false, "Пароли не совпадают"];
    return [true, ""];
}

/**
 * Проверяет поле на наличие контента.
 * @function is_empty
 * @param {string} value - Значение поля.
 * @param {string} field_name - Человекочитаемое название поля для сообщения об ошибке.
 * @returns {ValidationResult} Кортеж: [isNotEmpty, errorMessage].
 */
export function is_empty(value: string, field_name: string): ValidationResult {
    value = value.trim();
    if (value.length === 0)
        return [false, `Введите ${field_name.toLowerCase()}`];
    return [true, ""];
}

/**
 * Проверка на корректность почты.
 * @function validate_email
 * @param {string} email - Почта для проверки.
 * @returns {ValidationResult} Кортеж: [isValid, errorMessage].
 */
export function validate_email(email: string): ValidationResult {
    email = email.trim();
    if (email.length === 0 || email.length >= 255)
        return [false, "Некорректный адрес электронной почты"];

    let ok = /^[A-Za-zа-яёА-ЯЁ0-9._%+-]+@[A-Za-zа-яёА-ЯЁ0-9.-]+\.[A-Za-zа-яёА-ЯЁ]{2,}$/.test(email);
    if (!ok)
        return [false, "Некорректный адрес электронной почты"];

    return [true, ""];
}

/**
 * Проверка на корректность валюты. Доступны только варианты из хранилища.
 * @function validate_currency
 * @param {string} currency - Валюта для проверки.
 * @returns {ValidationResult} Кортеж: [isValid, errorMessage].
 */
export function validate_currency(currency: string): ValidationResult {
    currency = currency.trim().toUpperCase();
    if (currencies.includes(currency))
        return [true, ""];
    return [false, "Валюта не поддерживается"];
}

/**
 * Проверка на корректность введённого бюджета.
 * @function validate_target_budget
 * @param {string} target - Значение для проверки.
 * @returns {ValidationResult} Кортеж: [isValid, errorMessage].
 */
export function validate_target_budget(target: string): ValidationResult {
    target = target.trim();
    const target_value = parseFloat(target);
    if (isNaN(target_value))
        return [false, "Планируемый бюджет должен быть дробным числом"];
    if (target_value <= 0)
        return [false, "Планируемый бюджет должен быть больше 0"];
    if (target_value > 1e18)
        return [false, "Планируемый бюджет слишком большой"];
    return [true, ""];
}

/**
 * Проверка на корректность введённой даты начала бюджета.
 * @function validate_start_date
 * @param {string} server_time - Текущее время сервера в формате, поддерживаемом Date().
 * @param {string} date_str - Дата начала, введённая пользователем.
 * @returns {ValidationResult} Кортеж: [isValid, errorMessage].
 */
export function validate_start_date(server_time: string, date_str: string): ValidationResult {
    date_str = date_str.trim();
    const date = new Date(date_str);
    const server_date = new Date(server_time);
    date.setHours(server_date.getHours());
    date.setMinutes(server_date.getMinutes());
    date.setSeconds(server_date.getSeconds());
    date.setMilliseconds(server_date.getMilliseconds());

    if (isNaN(date.getTime()))
        return [false, "Некорректная дата"];

    if (date < server_date)
        return [false, "Дата начала не может быть в прошлом"];

    if (date.getTime() - server_date.getTime() > 5 * 365.25 * 24 * 60 * 60 * 1000)
        return [false, "Дата начала не может быть больше 5 лет от текущей даты"];

    return [true, ""];
}

/**
 * Проверка на корректность введённой даты конца бюджета.
 * @function validate_end_date
 * @param {string} start_date_str - Дата начала бюджета.
 * @param {string} end_date_str - Дата конца бюджета.
 * @returns {ValidationResult} Кортеж: [isValid, errorMessage].
 */
export function validate_end_date(start_date_str: string, end_date_str: string): ValidationResult {
    start_date_str = start_date_str.trim();
    end_date_str = end_date_str.trim();
    if (end_date_str === "")
        return [true, ""];
    const start_date = new Date(start_date_str);
    const end_date = new Date(end_date_str);
    if (end_date < start_date)
        return [false, "Дата окончания должна быть позже даты начала"];
    if (end_date.getTime() - start_date.getTime() > 5 * 365.25 * 24 * 60 * 60 * 1000)
        return [false, "Период между датами не может превышать 5 лет"];
    return [true, ""];
}