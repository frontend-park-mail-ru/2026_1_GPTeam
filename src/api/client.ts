import {get_token} from "./csrf.ts";

export const CSRF_HEADER_NAME: string = "X-CSRF-Token";

/**
 * URL сервера, получаемый из переменных окружения.
 * @type {string}
 */
export const SERVER_URL: string = import.meta.env.VITE_SERVER_URL;

/**
 * HTTP клиент для выполнения запросов к серверу.
 * Конкатенирует базовый URL сервера с переданным путём и 
 * автоматически добавляет credentials: "include" для работы с куками.
 *
 * @function client
 * @param {string} url - Относительный путь API (например: "/profile/balance")
 * @param {RequestInit} [data] - Опции запроса (метод, заголовки, тело и т.д.)
 * @returns {Promise<Response>} Promise, разрешающийся объектом Response
 * @throws {TypeError} Если сетевое соединение прервано или URL невалиден
 */
export const client = (url: string, data: RequestInit = {}): Promise<Response> => {
    let token = get_token();
    if (!token) {
        token = "";
    }
    const mergedOptions: RequestInit = {
        credentials: "include",
        ...data,
        headers: {
            ...data.headers,
            [CSRF_HEADER_NAME]: token,
        },
    };
    return fetch(SERVER_URL + url, mergedOptions);
};
