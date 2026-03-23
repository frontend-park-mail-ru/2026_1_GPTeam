import { client } from "./client";
import { set_currencies, set_categories, set_transaction_types } from "../store/store";

/**
 * Загружает коды валют и сохраняет в store.
 * @returns {Promise<string[]>}
 */
export const load_currencies = async (): Promise<string[]> => {
    try {
        const response = await client("/enums/get_currency_codes", { method: "GET" });
        const data = await response.json();
        if (data.code === 200 && Array.isArray(data.currency_codes)) {
            set_currencies(data.currency_codes);
            return data.currency_codes;
        }
    } catch {}
    return [];
};

/**
 * Загружает категории транзакций и сохраняет в store.
 * @returns {Promise<string[]>}
 */
export const load_categories = async (): Promise<string[]> => {
    try {
        const response = await client("/enums/get_category_types", { method: "GET" });
        const data = await response.json();
        if (data.code === 200 && Array.isArray(data.items)) {
            set_categories(data.items);
            return data.items;
        }
    } catch {}
    return [];
};

/**
 * Загружает типы транзакций и сохраняет в store.
 * @returns {Promise<string[]>}
 */
export const load_transaction_types = async (): Promise<string[]> => {
    try {
        const response = await client("/enums/get_transaction_types", { method: "GET" });
        const data = await response.json();
        if (data.code === 200 && Array.isArray(data.items)) {
            set_transaction_types(data.items);
            return data.items;
        }
    } catch {}
    return [];
};

export const fetchTransactionIds = async (): Promise<number[]> => {
    const response = await client("/transactions", { method: "GET" });
    const data: TransactionListResponse = await response.json();
    if (data.code === 200 && Array.isArray(data.ids)) {
        return data.ids;
    }
    return [];
};