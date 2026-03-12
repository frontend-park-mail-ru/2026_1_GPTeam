import {currencies} from "../store/store.js";

/**
 * Проверка логина на использование только разрешённых символов.
 * @function validate_username
 * @param {string} username - Логин.
 * @returns {[boolean, string]} Кортеж: [valid, errorMessage].
 */
export function validate_username(username) {
    username = username.trim();
    if (username.length < 3)
        return [false, "Логин должен быть минимум 3 символа"];
    let ok = /^[a-zA-Z0-9]+$/.test(username);
    if (!ok)
        return [false, "Логин должен содержать только буквы латинского алфавита или цифры"];
    return [true, ""];
}

/**
 * Внутренняя проверка состава символов в пароле.
 * Проверяет наличие строчных, заглавных букв и цифр методом перебора.
 * @function check_symbols
 * @param {string} password - Пароль для проверки.
 * @returns {[boolean, string]} Кортеж: [isValid, errorMessage].
 * @private
 */
function check_symbols(password) {
    let has_lower = false;
    let has_upper = false;
    let has_digit = false;
    let has_invalid = false;
    for (let symbol of password) {
        if ("a" <= symbol && symbol <= "z")
            has_lower = true;
        else if ("A" <= symbol && symbol <= "Z")
            has_upper = true;
        else if ("0" <= symbol && symbol <= "9")
            has_digit = true;
        else
            has_invalid = true;
    }
    if (!has_upper)
        return [false, "В пароле нет заглавной буквы"];
    if (!has_lower)
        return [false, "В пароле нет строчной буквы"];
    if (!has_digit)
        return [false, "В пароле нет цифры"];
    if (has_invalid)
        return [false, "Пароль должен содержать только буквы латинского алфавита и цифры"];
    return [true, ""];
}

/**
 * Валидирует пароль на сложность и длину.
 * Комбинирует проверку длины и вызов внутренней функции check_symbols.
 * @function validate_password
 * @param {string} password - Пароль для проверки.
 * @returns {[boolean, string]} Кортеж: [isValid, errorMessage].
 *
 * @example
 * const [isValid, error] = validate_password('123'); // [false, "Пароль должен быть минимум 8 символов"]
 */
export function validate_password(password) {
    password = password.trim();
    if (password.length < 8)
        return [false, "Пароль должен быть минимум 8 символов"];
    return check_symbols(password);
}

/**
 * Сравнивает два пароля на идентичность.
 * Используется на странице регистрации (SignupPage) для проверки подтверждения.
 * @function are_password_equal
 * @param {string} password - Основной пароль.
 * @param {string} confirm_password - Повторно введенный пароль.
 * @returns {[boolean, string]} Кортеж: [isEqual, errorMessage].
 */
export function are_password_equal(password, confirm_password) {
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
 * @returns {[boolean, string]} Кортеж: [isNotEmpty, errorMessage].
 */
export function is_empty(value, field_name) {
    value = value.trim();
    if (value.length === 0)
        return [false, `${field_name} не может быть пустым`];
    return [true, ""];
}

/**
 * Проверка на корректность почты.
 * @function validate_email
 * @param {string} email - Почта для проверки.
 * @returns {[boolean, string]} Кортеж: [isValid, errorMessage].
 * @private
 */
export function validate_email(email) {
    email = email.trim();
    if (email.length === 0 || email.length >= 255)
        return [false, "Некорректный адрес электронной почты"];
    let ok = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
    if (!ok)
        return [false, "Некорректный адрес электронной почты"];
    return [true, ""];
}

/**
 * Проверка на корректность валюты. Доступны только варианты из хранилища.
 * @function validate_currency
 * @param {string} currency - Валюта для проверки.
 * @returns {[boolean, string]} Кортеж: [isValid, errorMessage].
 * @private
 */
export function validate_currency(currency) {
    currency = currency.trim().toUpperCase();
    if (currencies.includes(currency))
        return [true, ""];
    return [false, "Валюта не поддерживается"];
}

/**
 * Проверка на корректность введённого бюджета.
 * Это должно быть положительное число (целое или дробное), но не больше 1e18.
 * @function validate_target_budget
 * @param {string} target - Значение для проверки.
 * @returns {[boolean, string]} Кортеж: [isValid, errorMessage].
 * @private
 */
export function validate_target_budget(target) {
    target = target.trim();
    let target_value = parseFloat(target);
    if (isNaN(target_value))
        return [false, "Планируемый бюджет должен быть дробным числом"];
    if (target_value < 0)
        return [false, "Планируемый бюджет не может быть меньше 0"];
    if (target_value > 1e18) {
        return [false, "Значение не может быть больше 1e18"]
    }
    return [true, ""];
}

/**
 * Проверка на корректность введённой даты начала бюджета.
 * Она не может быть в прошлом относительно текущего времени сервера.
 * @function validate_start_date
 * @param {string} server_time - Текущее время сервера в формате, поддерживаемом Date().
 * @param {string} date_str - Дата начала, введённая пользователем.
 * @returns {[boolean, string]} Кортеж: [isValid, errorMessage].
 */
export function validate_start_date(server_time, date_str) {
    date_str = date_str.trim();
    let date = new Date(date_str);
    let server_date = new Date(server_time);
    date.setTime(server_date.getTime());

    if (isNaN(date.getTime()))
        return [false, "Некорректная дата"];

    if (date < server_date)
        return [false, "Дата начала не может быть в прошлом"];

    if (date - server_date > 5 * 365.25 * 24 * 60 * 60 * 1000)
        return [false, "Дата начала не может быть больше 5 лет от текущей даты"];

    return [true, ""];
}

/**
 * Проверка на корректность введённой даты начала бюджета.
 * Она может быть пустой. Но если она не пустая, то она обязана быть больше даты начала.
 * @function validate_end_date
 * @param {string} start_date_str - Дата начала бюджета.
 * @param {string} end_date_str - Дата конца бюджета.
 * @returns {[boolean, string]} Кортеж: [isValid, errorMessage].
 * @private
 */
export function validate_end_date(start_date_str, end_date_str) {
    start_date_str = start_date_str.trim();
    end_date_str = end_date_str.trim();
    if (end_date_str === "")
        return [true, ""];
    let start_date = new Date(start_date_str);
    let end_date = new Date(end_date_str);
    if (end_date < start_date)
        return [false, "Дата окончания должна быть позже даты начала"];
    if (end_date - start_date > 5 * 365.25 * 24 * 60 * 60 * 1000)
        return [false, "Период между датами не может превышать 5 лет"];
    return [true, ""];
}
