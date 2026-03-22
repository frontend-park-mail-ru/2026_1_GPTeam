/**
 * @fileoverview Главная точка входа приложения Finance Manager.
 * Отвечает за импорт глобальных стилей, регистрацию маршрутов в роутере
 * и запуск жизненного цикла одностраничного приложения (SPA).
 */

import { router } from "./router/router_instance.js";
import { LoginPage } from "./pages/Login/login.js";
import { SignupPage } from "./pages/Signup/signup.js";
import { BudgetPage } from "./pages/Budget/budget.js";
import "./styles/global.css";
import { LandingPage } from "./pages/Landing/landing.js";
import { ProfilePage } from "./pages/Profile/profile.js";
import { BalancePage } from "./pages/Balance/balance.js";
import {load_currencies} from "./api/currency.js";
import {set_currencies} from "./store/store.js";

/**
 * Конфигурация маршрутизатора.
 * Связывает URL-пути с фабриками компонентов страниц.
 * Использует Chaining (цепочку вызовов) для регистрации всех доступных разделов приложения.
 */
router
    .addRoute("/", () => new LandingPage())
    .addRoute("/login", () => new LoginPage())
    .addRoute("/signup", () => new SignupPage())
    .addRoute("/profile", () => new ProfilePage())
    .addRoute("/balance", () => new BalancePage())
    .addRoute("/budget", () => new BudgetPage());

/**
 * Инициализирует приложение и запускает обработку текущего URL.
 * * @async
 * @function init
 * @description Вызывает метод start у роутера, который определяет, 
 * какую страницу отрисовать при первой загрузке или обновлении окна браузера.
 * @returns {Promise<void>}
 */
async function init() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/service_worker.js")
            .catch(error => console.error(error));
    }

    router.start();
    let currencies = await load_currencies();
    set_currencies(currencies);
}

init();
