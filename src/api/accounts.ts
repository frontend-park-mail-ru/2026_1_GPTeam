import { client } from "./client";

/**
 * Получает account_id текущего пользователя.
 * @returns {Promise<number>}
 */
export const fetchAccountId = async (): Promise<number> => {
    const response = await client("/api/account", { method: "GET" });
    const data = await response.json();
    if (data.code === 200) {
        return data.account_id;
    }
    throw new Error("Не удалось получить счёт");
};