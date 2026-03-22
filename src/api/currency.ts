import { client } from "./client";
import { set_currencies } from "../store/store.js";

/**
 * Интерфейс ответа от эндпоинта /enums/get_currency_codes.
 * @interface CurrencyResponse
 */
interface CurrencyResponse {
    /** Статус-код ответа бэкенда */
    code: number;
    /** Сообщение об ошибке или успехе */
    message?: string;
    /** Массив строковых кодов валют (ISO 4217) */
    currency_codes: string[];
}

/**
 * Асинхронная функция для получения списка доступных валют с бэкенда.
 * После успешного запроса обновляет внутреннее хранилище через {@link set_currencies}.
 * * @async
 * @function load_currencies
 * @returns {Promise<string[]>} Промис, разрешающийся в массив кодов валют.
 * @throws {Error} Выбрасывает исключение при сетевой ошибке или ошибке парсинга JSON.
 * * @example
 * try {
 * const codes = await load_currencies();
 * console.log("Валюты успешно обновлены:", codes);
 * } catch (err) {
 * console.error("Критическая ошибка загрузки справочников");
 * }
 */
export const load_currencies = async (): Promise<string[]> => {
    try {
        const response = await client("/enums/get_currency_codes", {
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CurrencyResponse = await response.json();

        if (data.code !== 200 || !data.currency_codes) {
            console.warn("Бэкенд вернул ошибку или пустой список валют:", data.message);
            return [];
        }

        // Синхронизируем полученные данные с глобальными константами
        set_currencies(data.currency_codes);
        
        return data.currency_codes;
    } catch (error) {
        console.error("Ошибка в load_currencies:", error);
        // Возвращаем пустой массив, чтобы не «вешать» фронтенд при ошибке сети
        return [];
    }
};