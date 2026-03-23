import { client } from "./client";
import { 
    Transaction, 
    TransactionListResponse, 
    TransactionGetResponse, 
    TransactionActionResponse,
    SimpleResponse
} from "../types/interfaces";

/**
 * Получает список всех ID транзакций пользователя.
 * Эндпоинт: GET /transactions
 */
export const fetchTransactionIds = async (): Promise<number[]> => {
    const response = await client("/transactions", { method: "GET" });
    const data: TransactionListResponse = await response.json();
    
    if (data.code === 200) {
        return data.ids;
    }
    return [];
};

/**
 * Получает детальную информацию о конкретной транзакции.
 * Эндпоинт: GET /transactions/{id}
 */
export const fetchTransactionDetail = async (id: number): Promise<Transaction | null> => {
    const response = await client(`/transactions/${id}`, { method: "GET" });
    const data: TransactionGetResponse = await response.json();
    
    if (data.code === 200) {
        return data.transaction;
    }
    return null;
};

/**
 * Удаляет транзакцию.
 * Эндпоинт: DELETE /transactions/{id}
 */
export const deleteTransaction = async (id: number): Promise<boolean> => {
    const response = await client(`/transactions/${id}`, { method: "DELETE" });
    const data: SimpleResponse = await response.json();
    return data.code === 200;
};

/**
 * Создает новую транзакцию.
 * Эндпоинт: POST /transactions
 */
export const createTransaction = async (transactionData: Partial<Transaction>): Promise<number | null> => {
    const response = await client("/transactions", {
        method: "POST",
        body: JSON.stringify(transactionData),
    });
    const data: TransactionActionResponse = await response.json();
    
    if (data.code === 200 || data.code === 201) {
        return data.transaction_id;
    }
    return null;
};