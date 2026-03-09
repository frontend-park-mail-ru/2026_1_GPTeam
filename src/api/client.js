/**
 * URL сервера, получаемый из переменных окружения.
 * @type {string}
 */
export const SERVER_URL = import.meta.env.VITE_SERVER_URL;

/**
 * HTTP клиент для выполнения запросов к серверу.
 * Конкатенирует базовый URL сервера с переданным путём.
 * * @function client
 * @param {string} url - Относительный путь API (например: "/profile/balance")
 * @param {RequestInit} [data] - Опции запроса (метод, заголовки, тело и т.д.)
 * @returns {Promise<Response>} Promise, разрешающийся объектом Response
 * @throws {TypeError} Если сетевое соединение прервано или URL невалиден
 * * @example
 * const response = await client("/profile", {
 * method: 'GET',
 * credentials: 'include'
 * });
 */
export const client = (url, data) => fetch(SERVER_URL + url, data)