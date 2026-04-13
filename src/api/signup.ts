import { client } from "./client.ts";
import type { AuthResponse } from "../types/interfaces.ts";

/**
 * Регистрирует нового пользователя на сервере.
 * Отправляет POST-запрос с данными учётной записи в формате JSON.
 *
 * @async
 * @function signup
 * @param {string} username - Имя пользователя.
 * @param {string} password - Пароль.
 * @param {string} confirm_password - Подтверждение пароля.
 * @param {string} email - Email пользователя.
 * @returns {Promise<AuthResponse>} Объект ответа сервера.
 * @throws {Error} Если сетевой запрос завершился неудачей или парсинг JSON не удался.
 *
 * @example
 * const result = await signup('john', 'Pass123', 'Pass123', 'john@example.com');
 * if (result.code === 200) {
 *   console.log('Регистрация успешна');
 * }
 */
export const signup = async (
  username: string,
  password: string,
  confirm_password: string,
  email: string
): Promise<AuthResponse> => {
  const response = await client("/auth/signup", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password, confirm_password, email }),
  });
  return await response.json();
};