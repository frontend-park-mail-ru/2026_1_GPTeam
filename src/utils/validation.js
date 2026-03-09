export function validate_username(username) {
    username = username.trim();
    if (username.length < 3)
        return [false, "Логин должен быть минимум 3 символа"];
    let ok = /^[a-zA-Z0-9]+$/.test(username);
    if (!ok)
        return [false, "Логин должен содержать только буквы латинского алфавита или цифры"];
    return [true, ""];
}

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

export function validate_password(password) {
    password = password.trim();
    if (password.length < 8)
        return [false, "Пароль должен быть минимум 8 символов"];
    return check_symbols(password);
}

export function are_password_equal(password, confirm_password) {
    password = password.trim();
    confirm_password = confirm_password.trim();
    if (password !== confirm_password)
        return [false, "Пароли не совпадают"];
    return [true, ""];
}

export function is_empty(value, field_name) {
    value = value.trim()
    if (value.length === 0)
        return [false, `${field_name} не может быть пустым`];
    return [true, ""];
}

export function validate_email(email) {
    email = email.trim();
    if (email.length === 0 || email.length >= 255)
        return [false, "Некорректный адрес электронной почты"];
    let ok = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
    if (!ok)
        return [false, "Некорректный адрес электронной почты"];
    return [true, ""];
}
