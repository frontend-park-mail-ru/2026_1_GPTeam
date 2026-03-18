import { Router } from "./router.js";

/**
 * Контейнер для отрисовки приложения.
 * @type {HTMLElement}
 */
const root = document.getElementById("app") as HTMLElement;

/**
 * Экспортируемый экземпляр маршрутизатора (Singleton).
 *
 * @example
 * import { router } from "../../router/router_instance.js";
 * router.navigate('/profile');
 *
 * @type {Router}
 */
export const router = new Router(root);