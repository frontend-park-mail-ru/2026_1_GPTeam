import {client} from "./client.js";
import {is_login} from "./auth.js";

/**
 * Получает данные профиля пользователя с сервера.
 * При получении кода 401 (Unauthorized) автоматически пытается обновить токен
 * и повторить запрос один раз.
 * * @async
 * @function get_profile
 * @returns {Promise<Object>} Объект с данными ответа (содержит code и данные профиля)
 * @property {number} code - Статус-код ответа сервера
 * @throws {Error} Если сетевой запрос завершился ошибкой или произошёл сбой парсинга JSON
 * * @example
 * const profileData = await get_profile();
 * if (profileData.code === 200) {
 * console.log('Имя пользователя:', profileData.username);
 * }
 */
export const get_profile = async function () {
    let response = await client("/profile", {
        method: "GET",
        credentials: "include",
    })
    let data = await response.json();
    if (data.code === 401) {
        let login = await is_login();
        if (login) {
            response = await client("/profile", {
                method: "GET",
                credentials: "include",
            })
            return await response.json();
        }
    }
    return data;
}