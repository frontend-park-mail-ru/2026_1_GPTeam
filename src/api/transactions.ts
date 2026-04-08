import { client } from "./client";
import { 
    Transaction, 
    TransactionListResponse, 
    TransactionGetResponse, 
    TransactionActionResponse,
    SimpleResponse,
    TransactionCreateRequest,
    RequestWithErrors
} from "../types/interfaces";

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
 * @returns {Promise<boolean>} true если успешно, иначе false
 */
export const deleteTransaction = async (id: number): Promise<boolean> => {
    const response = await client(`/api/transactions/${id}`, { method: "DELETE" });
    const data: SimpleResponse = await response.json();
    return data.code === 200;
};

/**
 * Создает новую транзакцию.
 * @endpoint POST /transactions
 * @param {TransactionCreateRequest} transactionData - Данные транзакции
 * @returns {Promise<number | null>} ID созданной транзакции или null
 */
export const createTransaction = async (transactionData: TransactionCreateRequest): Promise<number | null> => {
    const response = await client("/api/transactions", {
        method: "POST",
        body: JSON.stringify(transactionData),
    });
    const data: TransactionActionResponse = await response.json();
    
    if (data.code === 200 || data.code === 201) {
        return data.transaction_id;
    }
    return null;
};

/**
 * Обновляет существующую транзакцию.
 * @endpoint PUT /transactions/{id}
 * @param {number} id - ID транзакции для обновления
 * @param {TransactionCreateRequest} transactionData - Новые данные транзакции
 * @returns {Promise<{ success: boolean; errors?: Array<{ field: string; message: string }> }>} Результат обновления
 */
export const updateTransaction = async (
    id: number, 
    transactionData: TransactionCreateRequest
): Promise<{ success: boolean; errors?: Array<{ field: string; message: string }> }> => {
    const response = await client(`/api/transactions/${id}`, {
        method: "PUT",
        body: JSON.stringify(transactionData),
    });
    const data: SimpleResponse | RequestWithErrors = await response.json();
    
    if (data.code === 200) {
        return { success: true };
    }
    
    if ("errors" in data && data.errors) {
        return { success: false, errors: data.errors };
    }
    
    return { success: false };
};