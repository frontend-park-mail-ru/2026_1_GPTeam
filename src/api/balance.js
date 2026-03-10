import {client} from "./client.js";
import {is_login} from "./auth.js";

/**
 * Получает баланс профиля пользователя с сервера.
 * При получении кода 401 (Unauthorized) автоматически пытается обновить токен
 * и повторить запрос один раз.
 * * @async
 * @function get_balance
 * @returns {Promise<Object>} Объект с данными ответа (содержит code и data)
 * @property {number} code - Статус-код ответа сервера
 * @throws {Error} Если сетевой запрос завершился ошибкой или произошёл сбой парсинга JSON
 * * @example
 * const balanceData = await get_balance();
 * if (balanceData.code === 200) {
 * console.log('Баланс:', balanceData.data);
 * }
 */
export const get_balance = async function () {
    let response = await client("/profile/balance", {
        method: "GET",
        credentials: "include",
    })
    let data = await response.json();
    if (data.code === 401) {
        let login = await is_login();
        if (login) {
            response = await client("/profile/balance", {
                method: "GET",
                credentials: "include",
            })
            return await response.json();
        }
    }
    return data;
}