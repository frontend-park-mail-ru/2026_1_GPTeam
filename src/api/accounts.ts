import { client } from "./client";
import {ShortAccountResponse} from "../types/interfaces.ts";
import {is_login} from "./auth.ts";

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

export const get_short_accounts = async (): Promise<ShortAccountResponse> => {
    let response: Response = await client("/api/accounts", {
        method: "GET",
        credentials: "include",
    });
    let data: ShortAccountResponse = await response.json();
    if (data.code === 401) {
        let login: boolean = await is_login();
        if (login) {
            let retry_response: Response = await client("/api/accounts", {
                method: "GET",
                credentials: "include",
            });
            return await retry_response.json();
        }
    }
    return data;
}
