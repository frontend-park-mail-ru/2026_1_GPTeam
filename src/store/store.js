/**
 * Хранилище валют, которые доступны на сайте.
 * Используется в формах для того, чтобы предоставить пользователю ограниченный выбор.
 */
let currencies;

/**
 * Экспортируемая функция для получения доступных валют.
 * @function get_currencies
 * @returns {Array[string]}
 */
export function get_currencies() {
    return currencies;
}

/**
 * Экспортируемая функция для установки массива доступных валют извне.
 * @function set_currencies
 * @param {Array[string]} new_currencies - Новый массив валют.
 * @returns {void}
 */
export function set_currencies(new_currencies) {
    currencies = new_currencies;
}
