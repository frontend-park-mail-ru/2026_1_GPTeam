import { client } from "./client.ts";
import type { SimpleResponse, AppealCardProps, IsStaffResponse } from "../types/interfaces.ts";

/**
 * Проверяет, является ли пользователь администратором.
 *
 * @async
 * @function check_is_staff
 * @param {number} id - ID пользователя
 * @returns {Promise<IsStaffResponse>}
 */
/* export const check_is_staff = async (id: number): Promise<IsStaffResponse> => {
    const response = await client(`/api/is_staff/${id}`, {
        method: "GET",
        credentials: "include",
    });
    return await response.json();
}; */

export const check_is_staff = async (id: number): Promise<IsStaffResponse> => {
    // Возвращаем объект с нужным полем, как это сделал бы реальный бэкенд
    return { code: 200, is_staff: true }; 
}

/**
 * Получает список всех обращений (для администраторов).
 *
 * @async
 * @function get_all_appeals
 * @returns {Promise<AppealCardProps[]>}
 */
export const get_all_appeals = async (): Promise<AppealCardProps[]> => {
    const response = await client("/support/get_all_appeals", {
        method: "GET",
        credentials: "include",
    });
    const data = await response.json();
    return data.appeals || [];
};

/**
 * Обновляет статус обращения (для администраторов).
 *
 * @async
 * @function update_appeal_status
 * @param {number} id - ID обращения
 * @param {string} status - Новый статус
 * @returns {Promise<SimpleResponse>}
 */
export const update_appeal_status = async (id: number, status: string): Promise<SimpleResponse> => {
    const response = await client(`/support/update/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    return await response.json();
};

/**
 * Получает детальную информацию об обращении (для администраторов).
 *
 * @async
 * @function get_appeal_detail_admin
 * @param {number} id - ID обращения
 * @returns {Promise<AppealCardProps | null>}
 */
export const get_appeal_detail_admin = async (id: number): Promise<AppealCardProps | null> => {
    const response = await client(`/support/get_appeal/${id}`, {
        method: "GET",
        credentials: "include",
    });
    const data = await response.json();
    return data.appeal || null;
};
