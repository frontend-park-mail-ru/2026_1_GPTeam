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
import { load_categories, load_currencies, load_transaction_types } from "./api/currency.ts";
import { set_currencies } from "./store/store.ts";
import { TransactionDetailPage } from "./pages/TransactionsDetail/transactions_detail.ts";

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
 * Валидация критических данных перед стартом
 */
async function validateAndLoadData() {
    try {
        const [currencies, categories, types] = await Promise.all([
            load_currencies(),
            load_categories(),
            load_transaction_types(),
        ]);

        if (!currencies || currencies.length === 0) {
            console.warn("Критическая ошибка: валюты не загружены");
        } else {
            set_currencies(currencies);
        }
        
        return true;
    } catch (error) {
        console.error("Ошибка при инициализации данных:", error);
        return false;
    }
}

/**
 * Регистрация Service Worker с учетом окружения Vite
 */
async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || 
        import.meta.env.VITE_ENABLE_SW !== 'true' || 
        import.meta.env.DEV) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register('/service_worker.js', {
            type: 'module'
        });
        console.log('SW registered in production:', registration.scope);
    } catch (error) {
        console.error('SW registration failed:', error);
    }
}

async function init() {
    // 1. Сначала пытаемся загрузить данные
    const isDataLoaded = await validateAndLoadData();
    
    // 2. Запускаем роутер в любом случае (чтобы показать хотя бы 404 или ошибку)
    router.start();

    // 3. Регистрируем SW в фоновом режиме
    registerServiceWorker();
    
    if (!isDataLoaded) {
        // Можно выкинуть уведомление пользователю, что сервер недоступен
        console.error("Приложение запущено с ограниченным функционалом (офлайн-режим или ошибка сервера)");
    }
}

init();