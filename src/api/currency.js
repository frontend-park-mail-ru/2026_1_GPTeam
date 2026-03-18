import { client } from "./client.js";


/**
 * Функция, которая получает с бэкенда список доступных валют.
 * * @async
 * @function load_currencies
 * @returns {Promise<Array>} Массив со строковыми кодами валют.
 * @throws {Error} Если сетевой запрос завершился неудачей или парсинг JSON не удался.
 */
export const load_currencies = async function () {
    let response = await client("/enums/get_currency_codes", {
        method: "GET",
    });
    let data = await response.json();
    if (data.code !== 200) {
        return [];
    }
    return data.currency_codes;
};
