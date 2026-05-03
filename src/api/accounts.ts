import { client } from "./client";
import { is_login } from "./auth";
import type {
    AccountCreateRequest,
    AccountListResponse,
    AccountResponse,
    AccountUpdateRequest,
    SimpleResponse,
} from "../types/interfaces";

const JSON_HEADERS = { "Content-Type": "application/json" };

async function parseJson<T>(response: Response): Promise<T> {
    return await response.json().catch(() => ({
        code: response.status,
        message: `Ошибка сервера: ${response.status}`,
    } as T));
}

async function requestWithRefresh<T>(url: string, options: RequestInit): Promise<T> {
    let response = await client(url, options);
    let data = await parseJson<T & SimpleResponse>(response);

    if (data.code === 401 && await is_login()) {
        response = await client(url, options);
        data = await parseJson<T & SimpleResponse>(response);
    }

    return data as T;
}

/**
 * Получает account_id базового счёта текущего пользователя.
 * @returns {Promise<number>}
 */
export const fetchAccountId = async (): Promise<number> => {
    const response = await client("/api/account", { method: "GET" });
    const data = await parseJson<{ code: number; account_id?: number }>(response);
    if (data.code === 200 && typeof data.account_id === "number") {
        return data.account_id;
    }
    throw new Error("Не удалось получить счёт");
};

/** Возвращает все счета авторизованного пользователя. */
export const fetchAccounts = async (): Promise<AccountListResponse> => {
    return requestWithRefresh<AccountListResponse>("/api/accounts", { method: "GET" });
};

/** Получает один счёт по id. */
export const fetchAccount = async (id: number): Promise<AccountResponse> => {
    return requestWithRefresh<AccountResponse>(`/api/accounts/${id}`, { method: "GET" });
};

/** Создаёт новый счёт. */
export const createAccount = async (payload: AccountCreateRequest): Promise<AccountResponse> => {
    return requestWithRefresh<AccountResponse>("/api/accounts", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
    });
};

/** Частично обновляет счёт. */
export const updateAccount = async (id: number, payload: AccountUpdateRequest): Promise<AccountResponse> => {
    return requestWithRefresh<AccountResponse>(`/api/accounts/${id}`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
    });
};

/** Удаляет счёт. */
export const deleteAccount = async (id: number): Promise<SimpleResponse> => {
    return requestWithRefresh<SimpleResponse>(`/api/accounts/${id}`, { method: "DELETE" });
};

export interface ShortAccount {
    id: number;
    account_id: number;
    name: string;
    balance: number;
    currency: string;
}

export interface ShortAccountResponse {
    code: number;
    message?: string;
    accounts: ShortAccount[];
}

export const get_short_accounts = async (): Promise<ShortAccountResponse> => {
    const data = await fetchAccounts();

    if (data.code !== 200 || !Array.isArray(data.accounts)) {
        return {
            code: data.code,
            message: data.message,
            accounts: [],
        };
    }

    return {
        code: data.code,
        message: data.message,
        accounts: data.accounts.map((account) => ({
            id: account.id,
            account_id: account.id,
            name: account.name,
            balance: account.balance,
            currency: account.currency,
        })),
    };
};
