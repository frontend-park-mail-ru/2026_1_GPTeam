/**
 * @fileoverview Главная точка входа приложения Finance Manager.
 * Данный модуль инициализирует маршрутизацию, загружает справочники (валюты, категории)
 * в глобальное состояние (store) и регистрирует Service Worker для PWA.
 */

import { router } from "./router/router_instance.ts";
import { AppealPage } from "./pages/Appeal/appeal.ts";
import { AppealDetailPage } from "./pages/AppealDetail/appeal_detail.ts";
import { AdminAppealsPage } from "./pages/AdminAppeals/admin_appeals.ts";
import { AdminAppealDetailPage } from "./pages/AdminAppealDetail/admin_appeal_detail.ts";
import { LoginPage } from "./pages/Login/login.ts";
import { SignupPage } from "./pages/Signup/signup.ts";
import { BudgetPage } from "./pages/Budget/budget.ts";
import "./styles/global.scss";
import { LandingPage } from "./pages/Landing/landing.ts";
import { ProfilePage } from "./pages/Profile/profile.ts";
import { BalancePage } from "./pages/Balance/balance.ts";
import { ProfileEditPage } from "./pages/ProfileEdit/profile_edit.ts";
import { OperationsPage } from "./pages/Operations/operations.ts";
import { AvatarEditPage } from "./pages/AvatarEdit/avatar_edit.ts";
import { TransactionCreatePage } from "./pages/TransactionsCreate/transactions_create.ts";
import { TransactionDetailPage } from "./pages/TransactionsDetail/transactions_detail.ts";
import { ChangePasswordPage } from "./pages/ChangePassword/change_password.ts";
import { AdsBanner } from "./components/AdsBanner/ads_banner.ts";

import { load_categories, load_currencies, load_transaction_types } from "./api/currency.ts";
import { set_currencies, set_categories, set_transaction_types } from "./store/store.ts";
import { Header } from "./components/Header/header.ts";
import { initSupportWidget } from "./support.ts";
import { TransactionEditPage } from "./pages/TransactionsEdit/transactions_edit.ts";
import {BudgetEditPage} from "./pages/BudgetEdit/budget_edit.ts";

/**
 * Конфигурация маршрутизатора.
 */
router
    .addRoute("/", () => new LandingPage())
    .addRoute("/my_appeals", () => new AppealPage())
    .addRoute("/my_appeals/:id", (params) => new AppealDetailPage(params))
    .addRoute("/admin/appeals", () => new AdminAppealsPage())
    .addRoute("/admin/appeals/:id", (params) => new AdminAppealDetailPage(params))
    .addRoute("/login", () => new LoginPage())
    .addRoute("/signup", () => new SignupPage())
    .addRoute("/profile", () => new ProfilePage())
    .addRoute("/balance", () => new BalancePage())
    .addRoute("/budget", () => new BudgetPage())
    .addRoute("/budget/edit/:id", (params) => new BudgetEditPage(Number(params.id)))
    .addRoute("/profile/edit", () => new ProfileEditPage())
    .addRoute("/profile/change-password", () => new ChangePasswordPage())
    .addRoute("/operations", () => new OperationsPage())
    .addRoute("/profile/avatar", () => new AvatarEditPage())
    .addRoute("/operations/create", () => new TransactionCreatePage())
    .addRoute("/operations/:id", (p) => new TransactionDetailPage(Number(p.id)))
    .addRoute("/transactions/edit/:id", (params) => new TransactionEditPage(params));

/**
 * Загружает необходимые справочные данные с бэкенда и сохраняет их в стор.
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
const NO_ADS_ROUTES = new Set(["/", "/login", "/signup"]);

function getHeaderActivePath(path: string): string {
    if (path.startsWith("/operations")) return "/operations";
    if (path.startsWith("/profile")) return "/profile";
    if (path.startsWith("/budget")) return "/budget";
    if (path.startsWith("/balance")) return "/balance";
    return path;
}

/**
 * Обновляет CSS-переменную --header-height на основе реальной высоты хедера.
 */
function updateHeaderHeightVar(): void {
    const headerEl = document.getElementById("app_header");
    if (headerEl) {
        const height = headerEl.getBoundingClientRect().height;
        document.documentElement.style.setProperty("--header-height", `${height}px`);
    }
}

/**
 * Инициализирует жизненный цикл приложения.
 */
async function init(): Promise<void> {
    await validateAndLoadData();

    const headerContainer = document.getElementById("app_header")!;
    const appContent = document.getElementById("app_content");
    let header: Header | null = null;

    // Десктопные баннеры (слева и справа) — position: fixed, порядок в DOM не важен
    const adsLeftContainer = document.createElement("div");
    adsLeftContainer.className = "ads-banner-container ads-banner-container--left";
    document.body.appendChild(adsLeftContainer);

    const adsRightContainer = document.createElement("div");
    adsRightContainer.className = "ads-banner-container ads-banner-container--right";
    document.body.appendChild(adsRightContainer);

    // Мобильный верхний баннер — вставляем ПЕРЕД app_content чтобы он был сверху
    const adsTopContainer = document.createElement("div");
    adsTopContainer.className = "ads-banner-container ads-banner-container--top";
    if (appContent?.parentNode) {
        appContent.parentNode.insertBefore(adsTopContainer, appContent);
    } else {
        document.body.prepend(adsTopContainer);
    }

    // Мобильный нижний баннер — добавляем после app_content
    const adsBottomContainer = document.createElement("div");
    adsBottomContainer.className = "ads-banner-container ads-banner-container--bottom";
    const appRoot = appContent?.parentNode ?? document.body;
    appRoot.appendChild(adsBottomContainer);

    let adsBannerLeft: AdsBanner | null = null;
    let adsBannerRight: AdsBanner | null = null;
    let adsBannerTop: AdsBanner | null = null;
    let adsBannerBottom: AdsBanner | null = null;

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
            // Обновляем высоту хедера после его рендера
            requestAnimationFrame(updateHeaderHeightVar);
        }

        if (NO_ADS_ROUTES.has(path)) {
            if (adsBannerLeft) { adsBannerLeft.destroy(); adsBannerLeft = null; }
            if (adsBannerRight) { adsBannerRight.destroy(); adsBannerRight = null; }
            if (adsBannerTop) { adsBannerTop.destroy(); adsBannerTop = null; }
            if (adsBannerBottom) { adsBannerBottom.destroy(); adsBannerBottom = null; }
        } else {
            if (!adsBannerLeft) {
                adsBannerLeft = new AdsBanner();
                adsBannerLeft.render(adsLeftContainer);
            }
            if (!adsBannerRight) {
                adsBannerRight = new AdsBanner();
                adsBannerRight.render(adsRightContainer);
            }
            if (!adsBannerTop) {
                adsBannerTop = new AdsBanner();
                adsBannerTop.render(adsTopContainer);
            }
            if (!adsBannerBottom) {
                adsBannerBottom = new AdsBanner();
                adsBannerBottom.render(adsBottomContainer);
            }
        }
    });

    // Обновляем переменную при ресайзе окна
    window.addEventListener("resize", updateHeaderHeightVar);

    router.start();

    if (import.meta.env.VITE_ENABLE_SUPPORT === "true") {
        const appSupport: HTMLElement | null = document.getElementById("app_support");
        if (appSupport) {
            initSupportWidget(appSupport);
        }
    }

    if (!import.meta.env.DEV && "serviceWorker" in navigator && import.meta.env.VITE_ENABLE_SW === "true") {
        navigator.serviceWorker.register("/service_worker.js", { type: "module", scope: "/" })
            .then(() => console.log("Service Worker registered"))
            .catch((error) => console.error("Service Worker registration failed:", error));
    }
}

// Точка входа: запуск приложения
init();