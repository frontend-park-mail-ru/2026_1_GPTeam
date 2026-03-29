/**
 * @fileoverview Главная точка входа приложения Finance Manager.
 * Данный модуль инициализирует маршрутизацию, загружает справочники (валюты, категории)
 * в глобальное состояние (store) и регистрирует Service Worker для PWA.
 */

import { router } from "./router/router_instance.ts";
import { LoginPage } from "./pages/Login/login.ts";
import { SignupPage } from "./pages/Signup/signup.ts";
import { BudgetPage } from "./pages/Budget/budget.ts";
import "./styles/global.css";
import { LandingPage } from "./pages/Landing/landing.ts";
import { ProfilePage } from "./pages/Profile/profile.ts";
import { BalancePage } from "./pages/Balance/balance.ts";
import { ProfileEditPage } from "./pages/ProfileEdit/profile_edit.ts";
import { OperationsPage } from "./pages/Operations/operations.ts";
import { AvatarEditPage } from "./pages/AvatarEdit/avatar_edit.ts";
import { TransactionCreatePage } from "./pages/TransactionsCreate/transactions_create.ts";
import { TransactionDetailPage } from "./pages/TransactionsDetail/transactions_detail.ts";

import { load_categories, load_currencies, load_transaction_types } from "./api/currency.ts";
import { set_currencies, set_categories, set_transaction_types } from "./store/store.ts";
import { Header } from "./components/Header/header.ts";

/**
 * Конфигурация маршрутизатора.
 * Связывает URL-пути с фабриками компонентов соответствующих страниц.
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
    .addRoute("/operations/create", () => new TransactionCreatePage())
    .addRoute("/operations/:id", (p) => new TransactionDetailPage(Number(p.id)));

/**
 * Загружает необходимые справочные данные с бэкенда и сохраняет их в стор.
 * * @async
 * @function validateAndLoadData
 * @description Выполняет параллельные запросы к API для получения списка валют,
 * категорий и типов транзакций. В случае успеха обновляет глобальное состояние.
 * @returns {Promise<boolean>} Возвращает true, если данные были успешно загружены и синхронизированы.
 */
async function validateAndLoadData(): Promise<boolean> {
    try {
        const [currencies, categories, types] = await Promise.all([
            load_currencies(),
            load_categories(),
            load_transaction_types(),
        ]);

        if (currencies) set_currencies(currencies);
        if (categories) set_categories(categories);
        if (types) set_transaction_types(types);

        return true;
    } catch (error) {
        console.error("Failed to sync with backend:", error);
        return false;
    }
}

const NO_HEADER_ROUTES = new Set(["/", "/login", "/signup"]);

function getHeaderActivePath(path: string): string {
    if (path.startsWith("/operations")) return "/operations";
    if (path.startsWith("/profile")) return "/profile";
    if (path.startsWith("/budget")) return "/budget";
    if (path.startsWith("/balance")) return "/balance";
    return path;
}

/**
 * Инициализирует жизненный цикл приложения.
 * @async
 * @function init
 * @description Порядок инициализации:
 * 1. Загрузка справочников (валюты, категории) с сервера.
 * 2. Запуск роутера и отрисовка страницы на основе текущего URL.
 * 3. Регистрация Service Worker (только в production режиме при наличии флага в .env).
 * @returns {Promise<void>}
 */
async function init(): Promise<void> {
    await validateAndLoadData();

    const headerContainer = document.getElementById("app_header")!;
    let header: Header | null = null;

    router.onRouteChange((path: string) => {
        if (NO_HEADER_ROUTES.has(path)) {
            headerContainer.style.display = "none";
        } else {
            headerContainer.style.display = "";
            const activePath = getHeaderActivePath(path);
            if (!header) {
                header = new Header({ cur_page: activePath });
                header.render(headerContainer);
            } else {
                header.updateActiveLink(activePath);
            }
        }
    });

    router.start();

    /**
     * Регистрация Service Worker для офлайн-режима.
     * Проверяет: окружение (не DEV), поддержку в браузере и флаг в .env.
     */
    if (
        !import.meta.env.DEV &&
        'serviceWorker' in navigator &&
        import.meta.env.VITE_ENABLE_SW === 'true'
    ) {
        try {
            await navigator.serviceWorker.register('/service_worker.js', { type: 'module' });
            console.log('Service Worker registered');
        } catch (e) {
            console.error('Service Worker registration failed:', e);
        }
    }
}

// Точка входа: запуск приложения
init();
