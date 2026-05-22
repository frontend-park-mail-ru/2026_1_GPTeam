import { client } from "./client";
import {
    Transaction,
    TransactionListResponse,
    TransactionGetResponse,
    TransactionActionResponse,
    SimpleResponse,
    TransactionCreateRequest,
    RequestWithErrors,
    TransactionSearchResponse,
    TransactionSearchFilters
} from "../types/interfaces";
import {is_login} from "./auth.ts";

/**
 * Получает список всех ID транзакций пользователя.
 * @endpoint GET /transactions
 * @returns {Promise<number[]>} Массив ID транзакций
 */
export const fetchTransactionIds = async (): Promise<number[]> => {
    const response = await client("/api/transactions", { method: "GET" });
    const data: TransactionListResponse = await response.json();
    
    if (data.code === 200) {
        return data.ids;
    }
    return [];
};

/**
 * Получает детальную информацию о конкретной транзакции.
 * @endpoint GET /transactions/{id}
 * @param {number} id - ID транзакции
 * @returns {Promise<Transaction | null>} Данные транзакции или null
 */
export const fetchTransactionDetail = async (id: number): Promise<Transaction | null> => {
    const response = await client(`/api/transactions/${id}`, { method: "GET" });
    const data: TransactionGetResponse = await response.json();
    if (data.code === 200) {
        return data.transaction;
    }
    return null;
};

/**
 * Удаляет транзакцию.
 * @endpoint DELETE /transactions/{id}
 * @param {number} id - ID транзакции
 * @returns {Promise<[boolean, string]>} true если успешно, иначе false и сообщение от сервера
 */
export const deleteTransaction = async (id: number): Promise<[boolean, string]> => {
    const response = await client(`/api/transactions/${id}`, { method: "DELETE" });
    const data: SimpleResponse = await response.json();
    return [data.code === 200, data.message ? data.message : ""];
};

/**
 * Создает новую транзакцию. Возвращает объект с успехом и массивом ошибок, если они есть.
 * @endpoint POST /transactions
 * @param {TransactionCreateRequest} transactionData - Данные транзакции
 */
export const createTransaction = async (
    transactionData: TransactionCreateRequest
): Promise<{ success: boolean; id?: number; errors?: Array<{ field: string; message: string }> }> => {
    const payload = {
        ...transactionData,
        transaction_date: new Date(transactionData.transaction_date).toISOString(),
    };

    const response = await client("/api/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    
    const data: TransactionActionResponse | RequestWithErrors = await response.json();
    
    if (data.code === 200 || data.code === 201) {
        return { success: true, id: (data as TransactionActionResponse).transaction_id };
    }

    if ("errors" in data && data.errors) {
        let errors: Array<{ field: string; message: string }> = data.errors;
        let server_message = data.message ? data.message : "Ошибка сервера";
        if (server_message === "constraint error") {
            server_message = "Невозможно выполнить такую транзакцию";
        }
        errors.push({field: "", message: server_message});
        return { success: false, errors: errors };
    }

    return { success: false, errors: [{ field: "", message: data.message || "Неизвестная ошибка" }] };
};

/**
 * Обновляет существующую транзакцию.
 * @endpoint PUT /transactions/{id}
 * @param {number} id - ID транзакции для обновления
 * @param {TransactionCreateRequest} transactionData - Новые данные транзакции
 */
export const updateTransaction = async (
    id: number,
    transactionData: TransactionCreateRequest
): Promise<{ success: boolean; errors?: Array<{ field: string; message: string }> }> => {
    const payload = {
        ...transactionData,
        transaction_date: new Date(transactionData.transaction_date).toISOString(),
    };

    const response = await client(`/api/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
    const data: SimpleResponse | RequestWithErrors = await response.json();

    if (data.code === 200) {
        return { success: true };
    }

    if ("errors" in data && data.errors) {
        let errors: Array<{ field: string; message: string }> = data.errors;
        let server_message = data.message ? data.message : "Ошибка сервера";
        if (server_message === "constraint error") {
            server_message = "Невозможно выполнить такую транзакцию";
        }
        errors.push({field: "", message: server_message});
        return { success: false, errors: errors };
    }
    return { success: false, errors: [] };
};

/**
 * Ищет транзакции с фильтрами.
 * @endpoint GET /transactions/search
 * @param {TransactionSearchFilters} filters - Фильтры поиска
 * @returns {Promise<Transaction[]>} Массив транзакций
 */
export const searchTransactions = async (
    filters: TransactionSearchFilters
): Promise<Transaction[]> => {
    const params = new URLSearchParams();

    if (filters.start_date) {
        params.append("start_date", new Date(filters.start_date).toISOString());
    }
    if (filters.end_date) {
        params.append("end_date", new Date(filters.end_date).toISOString());
    }
    if (filters.category) {
        params.append("category", filters.category);
    }
    if (filters.account_id) {
        params.append("account_id", String(filters.account_id));
    }
    if (filters.q) {
        params.append("q", filters.q);
    }

    const response = await client(`/api/transactions/search?${params.toString()}`, { method: "GET" });
    const data: TransactionSearchResponse = await response.json();

    if (data.code === 200) {
        return data.transactions;
    }
    return [];
};

/**
 * Получает автокомплит по названиям транзакций.
 * @endpoint GET /transactions/search
 * @param {string} query - Строка поиска
 * @returns {Promise<string[]>} Массив названий транзакций
 */
export const getTransactionTitlesAutocomplete = async (query: string): Promise<string[]> => {
    const params = new URLSearchParams();
    params.append("q", query);

    const response = await client(`/api/transactions/search?${params.toString()}`, { method: "GET" });
    const data: TransactionSearchResponse = await response.json();

    if (data.code === 200) {
        const titles = new Set<string>();
        data.transactions.forEach(t => {
            if (t.title) {
                titles.add(t.title);
            }
        });
        return Array.from(titles);
    }
    return [];
};

export const import_csv = async (file: File, account_id: string): Promise<{ success: boolean; errors?: Array<{ field: string; message: string }> }> => {
    let csv_file: File = new File([file], file.name, {
        type: "text/csv",
    });
    let formData: FormData = new FormData();
    formData.append("file", csv_file);
    formData.append("account_id", account_id)
    let response: Response = await client("/api/transactions/import", {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    let data: any = await response.json();
    if (data.code === 200)
        return { success: true };
    if (data.code === 401) {
        const login: boolean = await is_login();
        if (login) {
            const retry_response = await client("/api/transactions/import", {
                method: "POST",
                credentials: "include",
                body: formData,
            });
            data = await retry_response.json();
            if (data.code === 200)
                return { success: true };
        }
    }
    let errors: Array<{ field: string; message: string }> = data.errors ? data.errors : [];
    let message: string = data.message;
    if (message)
        errors.push({ field: "", message: message });
    return { success: false, errors: errors };
};

const parseContentDispositionFilename = (header: string | null): string | null => {
    if (!header) return null;
    const match = header.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/i);
    if (!match) return null;
    try {
        return decodeURIComponent(match[1].replace(/"/g, "").trim());
    } catch {
        return match[1].replace(/"/g, "").trim();
    }
};

const parseExportError = async (response: Response): Promise<never> => {
    let message = "Не удалось экспортировать транзакции";
    try {
        const data: { message?: string } = await response.json();
        if (data.message) message = data.message;
    } catch {
        // ignore non-JSON body
    }
    throw new Error(message);
};

const fetchExportResponse = (account_id: string): Promise<Response> =>
    client(`/api/transactions/export?account_id=${encodeURIComponent(account_id)}`, {
        method: "GET",
    });

const readExportFile = async (response: Response): Promise<{ blob: Blob; filename: string }> => {
    if (!response.ok) {
        await parseExportError(response);
    }
    const blob = await response.blob();
    const filename = parseContentDispositionFilename(response.headers.get("content-disposition")) ?? "transactions.csv";
    return { blob, filename };
};

export const export_csv = async (account_id: string): Promise<{ blob: Blob; filename: string }> => {
    let response = await fetchExportResponse(account_id);
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        const data: { code?: number; message?: string } = await response.json();
        if (data.code === 401) {
            const login = await is_login();
            if (login) {
                response = await fetchExportResponse(account_id);
                const retryContentType = response.headers.get("content-type") ?? "";
                if (retryContentType.includes("application/json")) {
                    const retryData: { message?: string } = await response.json();
                    throw new Error(retryData.message ?? "Не удалось экспортировать транзакции");
                }
                return readExportFile(response);
            }
        }
        throw new Error(data.message ?? "Не удалось экспортировать транзакции");
    }

    return readExportFile(response);
};
