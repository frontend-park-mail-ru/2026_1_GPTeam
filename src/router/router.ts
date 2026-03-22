import { BasePage } from "../pages/base_page.js";

/**
 * Класс для управления маршрутизацией страниц (SPA Router).
 * @class Router
 */
export class Router {
    /** @private */
    private root: HTMLElement;
    /** @private */
    private routes: Map<string, () => BasePage>;
    /** @private */
    private _currentPage: BasePage | null;

    /**
     * Создает экземпляр роутера.
     * @param {HTMLElement} root - Контейнер, в который будут рендериться все страницы приложения.
     */
    constructor(root: HTMLElement) {
        this.root = root;
        this.routes = new Map();
        this._currentPage = null;

        window.addEventListener("popstate", () => this._handleRoute());
        document.addEventListener("click", (e) => this._handleLinkClick(e));
    }

    /**
     * Регистрирует новый маршрут в приложении.
     *
     * @param {string} path - URL путь (например, '/profile').
     * @param {() => BasePage} pageFactory - Функция-фабрика, возвращающая экземпляр страницы.
     * @returns {Router} Текущий экземпляр роутера для поддержки цепочки вызовов.
     *
     * @example
     * router.addRoute('/login', () => new LoginPage())
     *       .addRoute('/profile', () => new ProfilePage());
     */
    addRoute(path: string, pageFactory: () => BasePage): Router {
        this.routes.set(path, pageFactory);
        return this;
    }

    /**
     * Переходит по указанному пути, обновляя историю браузера.
     * Если путь совпадает с текущим, переход игнорируется.
     *
     * @param {string} path - Путь для перехода.
     * @returns {void}
     */
    navigate(path: string): void {
        if (window.location.pathname === path) return;
        window.history.pushState({}, "", path);
        this._handleRoute();
    }

    /**
     * Принудительно перезагружает текущий маршрут.
     * @returns {void}
     */
    refresh(): void {
        this._handleRoute();
    }

    /**
     * Перехватывает клики по элементам с атрибутом `data-link`.
     * @private
     * @param {MouseEvent} e - Объект события клика.
     * @returns {void}
     */
    private _handleLinkClick(e: MouseEvent): void {
        const link = (e.target as HTMLElement).closest("[data-link]");
        if (!link) return;
        e.preventDefault();
        this.navigate(link.getAttribute("href") ?? "/");
    }

    /**
     * Основная логика смены страниц.
     * @private
     * @async
     * @returns {Promise<void>}
     */
    private async _handleRoute(): Promise<void> {
        const path = window.location.pathname;
        const pageFactory = this.routes.get(path) || this.routes.get("/404");

        if (this._currentPage?.destroy) {
            this._currentPage.destroy();
        }

        const page = pageFactory!();
        this._currentPage = page;
        this.root.innerHTML = "";
        await page.render(this.root);
    }

    /**
     * Запускает роутер при первичной загрузке приложения.
     * @returns {void}
     */
    start(): void {
        this._handleRoute();
    }
}