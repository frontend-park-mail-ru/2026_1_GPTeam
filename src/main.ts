/**
 * @fileoverview Главная точка входа приложения MoneyFirst.
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
import { ProfileEditPage } from "./pages/ProfileEdit/profile_edit.ts";
import { OperationsPage } from "./pages/Operations/operations.ts";
import { TransactionDetailPage } from "./pages/TransactionsDetail/transactions_detail.ts";
import { AvatarEditPage } from "./pages/AvatarEdit/avatar_edit.ts";
import { TransactionCreatePage } from "./pages/TransactionsCreate/transactions_create.ts";
import { load_currencies, load_categories, load_transaction_types } from "./api/currency.ts";

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
 * Инициализирует приложение: загружает справочники и запускает роутер.
 * @async
 * @function init
 * @returns {Promise<void>}
 */
async function init(): Promise<void> {
    await Promise.all([
        load_currencies(),
        load_categories(),
        load_transaction_types(),
    ]);
    router.start();
}

init();