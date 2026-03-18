import { client } from "./client.js";
import { is_login } from "./auth.js";

/**
 * Ответ сервера с балансом.
 */
interface BalanceResponse {
    code: number;
    data?: number;
}

/**
 * Получает баланс профиля пользователя с сервера.
 * При получении кода 401 (Unauthorized) автоматически пытается обновить токен
 * и повторить запрос один раз.
 *
 * @async
 * @function get_balance
 * @returns {Promise<BalanceResponse>} Объект с данными ответа (содержит code и data)
 * @throws {Error} Если сетевой запрос завершился ошибкой или произошёл сбой парсинга JSON
 *
 * @example
 * const balanceData = await get_balance();
 * if (balanceData.code === 200) {
 *   console.log('Баланс:', balanceData.data);
 * }
 */
export const get_balance = async (): Promise<BalanceResponse> => {
    const response = await client("/profile/balance", {
        method: "GET",
        credentials: "include",
    });
    const data: BalanceResponse = await response.json();
    if (data.code === 401) {
        const login = await is_login();
        if (login) {
            const retryResponse = await client("/profile/balance", {
                method: "GET",
                credentials: "include",
            });
            return await retryResponse.json();
        }
    }
    return data;
}