/**
 * @fileoverview Главная точка входа приложения Finance Manager.
 * Отвечает за импорт глобальных стилей, регистрацию маршрутов в роутере
 * и запуск жизненного цикла одностраничного приложения (SPA).
 */

import { router } from "./router/router_instance.ts";
import { LoginPage } from "./pages/Login/login.ts";
import { SignupPage } from "./pages/Signup/signup.ts";
import { BudgetPage } from "./pages/Budget/budget.ts";
import "./styles/global.css";
import { LandingPage } from "./pages/Landing/landing.ts";
import { ProfilePage } from "./pages/Profile/profile.ts";
import { BalancePage } from "./pages/Balance/balance.ts";
import { ProfileEditPage } from "./pages/ProfileEdit/profile_edit.ts"
import { OperationsPage } from "./pages/Operations/operations.ts";

import { AvatarEditPage } from "./pages/AvatarEdit/avatar_edit.ts";
import { TransactionCreatePage } from "./pages/TransactionsCreate/transactions_create.ts";
import {load_currencies} from "./api/currency.ts";
import {set_currencies} from "./store/store.ts";

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
    .addRoute("/budget", () => new BudgetPage())
    .addRoute("/profile/edit", () => new ProfileEditPage())
    .addRoute("/operations", () => new OperationsPage())
    .addRoute("/profile/avatar", () => new AvatarEditPage())
    .addRoute("/operations/create", () => new TransactionCreatePage());

/**
 * Инициализирует приложение и запускает обработку текущего URL.
 * @async
 * @function init
 * @description Выполняет начальную настройку приложения:
 * - Запускает роутер для отрисовки страницы по текущему маршруту.
 * - Регистрирует Service Worker для поддержки офлайн-режима и кэширования.
 * - Загружает список валют и сохраняет их в глобальном хранилище.
 * @returns {Promise<void>}
 */
async function init() {
    // Запуск роутера и отрисовка начального представления
    router.start();

    // Регистрация Service Worker для офлайн-поддержки
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/service_worker.js")
            .catch((error: Error) => console.error("Service Worker registration failed:", error));
    }

    // Загрузка и сохранение списка валют
    const currencies = await load_currencies();
    set_currencies(currencies);
}

// Запуск приложения
init();
