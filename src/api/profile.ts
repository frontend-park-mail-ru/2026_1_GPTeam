import { client } from "./client.js";
import { is_login } from "./auth.js";

/**
 * Ответ сервера с данными профиля.
 */
interface ProfileResponse {
    code: number;
    username?: string;
    email?: string;
}

/**
 * Получает данные профиля пользователя с сервера.
 * При получении кода 401 (Unauthorized) автоматически пытается обновить токен
 * и повторить запрос один раз.
 *
 * @async
 * @function get_profile
 * @returns {Promise<ProfileResponse>} Объект с данными ответа (содержит code и данные профиля)
 * @throws {Error} Если сетевой запрос завершился ошибкой или произошёл сбой парсинга JSON
 *
 * @example
 * const profileData = await get_profile();
 * if (profileData.code === 200) {
 *   console.log('Имя пользователя:', profileData.username);
 * }
 */
export const get_profile = async (): Promise<ProfileResponse> => {
    const response = await client("/profile", {
        method: "GET",
        credentials: "include",
    });
    const data: ProfileResponse = await response.json();
    if (data.code === 401) {
        const login = await is_login();
        if (login) {
            const retryResponse = await client("/profile", {
                method: "GET",
                credentials: "include",
            });
            return await retryResponse.json();
        }
    }
    return data;
}