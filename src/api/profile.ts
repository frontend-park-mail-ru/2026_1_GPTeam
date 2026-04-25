import { client } from "./client.ts";
import { is_login } from "./auth.ts";
// ДОБАВИЛИ ИМПОРТ User
import type { SimpleResponse, User } from "../types/interfaces.ts";

/**
 * Ответ сервера с данными профиля.
 * Теперь он правильно говорит, что внутри лежит объект user типа User (где есть id)
 */
export interface ProfileResponse extends SimpleResponse {
    user?: User; 
}

/**
 * Тело запроса на обновление профиля.
 */
export interface UpdateProfileRequest {
    username?: string;
    email?: string;
    password?: string;
    current_password?: string;
    avatar_url?: string;
}

/**
 * Получает данные профиля пользователя с сервера.
 * При получении кода 401 автоматически пытается обновить токен и повторить запрос.
 *
 * @async
 * @function get_profile
 * @returns {Promise<ProfileResponse>}
 */
export const get_profile = async (): Promise<ProfileResponse> => {
    const response = await client("/api/profile", {
        method: "GET",
        credentials: "include",
    });
    const data: ProfileResponse = await response.json();
    if (data.code === 401) {
        const login = await is_login();
        if (login) {
            const retryResponse = await client("/api/profile", {
                method: "GET",
                credentials: "include",
            });
            return await retryResponse.json();
        }
    }
    return data;
};

/**
 * Обновляет профиль пользователя.
 * Передаёт только заполненные поля — пустые игнорируются сервером.
 * При 401 пытается обновить токен и повторить запрос.
 *
 * @async
 * @function update_profile
 * @param {UpdateProfileRequest} body - Поля для обновления.
 * @returns {Promise<ProfileResponse>}
 */
export const update_profile = async (body: UpdateProfileRequest): Promise<ProfileResponse> => {
    const response = await client("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data: ProfileResponse = await response.json();
    if (data.code === 401) {
        const login = await is_login();
        if (login) {
            const retryResponse = await client("/api/profile", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            return await retryResponse.json();
        }
    }
    return data;
};