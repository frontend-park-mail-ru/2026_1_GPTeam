/**
 * Список полных названий месяцев на русском языке.
 * Используется для отображения дат в интерфейсе и заголовков графиков.
 * @constant {string[]}
 */
export const MONTHS: string[] = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

/**
 * Сокращённые названия дней недели (Пн-Вс).
 * Используется в компонентах календаря и выбора дат.
 * @constant {string[]}
 */
export const WEEKDAYS: string[] = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

/**
 * Внутреннее хранилище кодов валют (например, ["RUB", "USD"]).
 * Изначально пустое, наполняется через {@link set_currencies} после запроса к API.
 * @private
 */
let currencies: string[] = [];

/**
 * Возвращает текущий массив доступных кодов валют.
 * * @function get_currencies
 * @returns {string[]} Массив строковых кодов валют (ISO 4217).
 * * @example
 * const available = get_currencies();
 * console.log(available); // ["RUB", "USD", "EUR"]
 */
export function get_currencies(): string[] {
    return currencies;
}

/**
 * Обновляет глобальный список доступных валют.
 * Обычно вызывается один раз при инициализации приложения в функции load_currencies.
 * * @function set_currencies
 * @param {string[]} new_currencies - Массив новых кодов валют, полученных от бэкенда.
 * @returns {void}
 * * @example
 * set_currencies(["RUB", "USD", "EUR", "CNY"]);
 */
export function set_currencies(new_currencies: string[]): void {
    currencies = new_currencies;
}