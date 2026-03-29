import { Router } from "./router.ts";

/**
 * Контейнер для отрисовки приложения.
 * @type {HTMLElement}
 */
const root = document.getElementById("app_content") as HTMLElement;

/**
 * Экспортируемый экземпляр маршрутизатора (Singleton).
 *
 * @example
 * import { router } from "../../router/router_instance.ts";
 * router.navigate('/profile');
 *
 * @type {Router}
 */
export const router = new Router(root);
