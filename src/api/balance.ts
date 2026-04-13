import { client } from "./client.ts";
import { is_login } from "./auth.ts";
import type { BalanceResponse as BalanceResponseType } from "../types/interfaces.ts";

/**
 * Получает данные о балансах пользователя по всем валютам.
 * При получении кода 401 (Unauthorized) пытается обновить сессию и повторить запрос.
 *
 * @async
 * @function get_balance
 * @returns {Promise<BalanceResponseType>} Объект с массивом balances и датой
 * @throws {Error} Если сетевой запрос завершился ошибкой
 *
 * @example
 * const balanceData = await get_balance();
 * if (balanceData.code === 200) {
 * // Теперь данные лежат в массиве balances
 * balanceData.balances.forEach(b => console.log(`${b.currency}: ${b.balance}`));
 * }
 */
export const get_balance = async (): Promise<BalanceResponseType> => {
  const response = await client("/api/profile/balance", {
    method: "GET",
    credentials: "include",
  });
  
  const data: BalanceResponseType = await response.json();
  
  if (data.code === 401) {
    const login = await is_login();
    if (login) {
      const retryResponse = await client("/api/profile/balance", {
        method: "GET",
        credentials: "include",
      });
      return await retryResponse.json();
    }
  }
  
  return data;
};