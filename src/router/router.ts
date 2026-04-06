import { BasePage } from "../pages/base_page.ts";

/**
 * Класс для управления маршрутизацией страниц (SPA Router).
 * @class Router
 */
export class Router {
    private root: HTMLElement;
    private routes: { pattern: RegExp; keys: string[]; factory: (params: Record<string, string>) => BasePage }[];
    private _currentPage: BasePage | null;
    private _onRouteChange?: (path: string) => void;

    /**
     * @param {HTMLElement} root - Контейнер для рендера страниц.
     */
    constructor(root: HTMLElement) {
        this.root = root;
        this.routes = [];
        this._currentPage = null;

        window.addEventListener("popstate", () => this._handleRoute());
        document.addEventListener("click", (e) => this._handleLinkClick(e));
    }

    /**
     * Регистрирует маршрут. Поддерживает сегменты вида `:param`.
     *
     * @param {string} path - URL-путь, например `/operations/:id`.
     * @param {(params: Record<string, string>) => BasePage} pageFactory
     * @returns {Router}
     *
     * @example
     * router.addRoute('/operations/:id', (p) => new TransactionDetailPage(Number(p.id)));
     */
    addRoute(path: string, pageFactory: (params: Record<string, string>) => BasePage): Router {
        const keys: string[] = [];
        const pattern = new RegExp(
            "^" +
            path.replace(/:([^/]+)/g, (_, key) => {
                keys.push(key);
                return "([^/]+)";
            }) +
            "$"
        );
        this.routes.push({ pattern, keys, factory: pageFactory });
        return this;
    }

    /**
     * Переходит по пути, обновляя историю браузера.
     * @param {string} path
     */
    navigate(path: string): void {
        if (window.location.pathname === path) return;
        window.history.pushState({}, "", path);
        this._handleRoute();
    }

    /**
     * Регистрирует колбэк, вызываемый после каждой смены маршрута.
     * @param {(path: string) => void} cb
     */
    onRouteChange(cb: (path: string) => void): void {
        this._onRouteChange = cb;
    }

    /** Перезагружает текущий маршрут. */
    refresh(): void {
        this._handleRoute();
    }

    private _handleLinkClick(e: MouseEvent): void {
        const link = (e.target as HTMLElement).closest("[data-link]");
        if (!link) return;
        e.preventDefault();
        this.navigate(link.getAttribute("href") ?? "/");
    }

    private async _handleRoute(): Promise<void> {
        const path = window.location.pathname;

        let matched: { factory: (params: Record<string, string>) => BasePage; params: Record<string, string> } | null = null;

        for (const route of this.routes) {
            const m = path.match(route.pattern);
            if (m) {
                const params: Record<string, string> = {};
                route.keys.forEach((key, i) => { params[key] = m[i + 1]; });
                matched = { factory: route.factory, params };
                break;
            }
        }

        this._currentPage?.destroy?.();

        if (!matched) {
            const notFound = this.routes.find(r => r.pattern.source === "^\\/404$");
            if (notFound) {
                const page = notFound.factory({});
                this._currentPage = page;
                this.root.innerHTML = "";
                await page.render(this.root);
            }
            // pathname may have changed if render() triggered a nested navigate()
            this._onRouteChange?.(window.location.pathname);
            return;
        }

        const page = matched.factory(matched.params);
        this._currentPage = page;
        this.root.innerHTML = "";
        await page.render(this.root);
        // Do not use the captured `path`: during await, render() may call navigate()
        // (e.g. BalancePage 401 → /login). The outer frame would otherwise notify with a stale path.
        this._onRouteChange?.(window.location.pathname);
    }

    /** Запускает роутер при первичной загрузке. */
    start(): void {
        this._handleRoute();
    }
}