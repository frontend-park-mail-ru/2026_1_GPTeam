import { client } from "./client.js";
import type { SimpleResponse } from "../types/interfaces.js";

/**
 * Проверяет, авторизован ли пользователь, путём обновления токена.
 * Отправляет POST запрос на /auth/refresh с учетными данными.
 *
 * @async
 * @function is_login
 * @returns {Promise<boolean>} true если пользователь авторизован (код 200), иначе false
 * @throws {Error} Если сетевой запрос завершился неудачей или парсинг JSON не удался
 *
 * @example
 * const isLoggedIn = await is_login();
 * if (isLoggedIn) {
 *   console.log('Пользователь авторизован');
 * }
 */
export const is_login = async (): Promise<boolean> => {
  const response = await client("/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
  const data: SimpleResponse = await response.json();
  return data.code === 200;
};

/**
 * Разлогинивает пользователя.
 * Отправляет POST запрос на /auth/logout с учетными данными.
 *
 * @async
 * @function logout
 * @returns {Promise<boolean>} true если операция прошла успешно (код 200), иначе false
 * @throws {Error} Если сетевой запрос завершился неудачей или парсинг JSON не удался
 *
 * @example
 * const loggedOut = await logout();
 * if (loggedOut) {
 *   console.log('Пользователь разлогинен');
 * }
 */
export const logout = async (): Promise<boolean> => {
  const response = await client("/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  const data: SimpleResponse = await response.json();
  return data.code === 200;
};