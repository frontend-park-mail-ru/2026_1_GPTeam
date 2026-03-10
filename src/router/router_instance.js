import { Router } from "./router.js";

/**
 * Контейнер для отрисовки приложения.
 * Все страницы (наследники BasePage) будут рендериться внутри этого элемента.
 * @type {HTMLElement|null}
 */
const root = document.getElementById("app");

/**
 * Экспортируемый экземпляр маршрутизатора (Singleton).
 * Используется во всем приложении для управления переходами между страницами,
 * обновления текущего состояния и программной навигации.
 * * @example
 * import { router } from "../../router/router_instance.js";
 * router.navigate('/profile'); // Переход на страницу профиля
 * * @type {Router}
 */
export const router = new Router(root);