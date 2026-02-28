/**
 * @module Router
 * @description Клиентский роутер для SPA, работающий через History API
 */
export class Router {
    /**
     * @param {HTMLElement} root - корневой элемент для рендера страниц
     */
    constructor(root) {
        this.root = root;
        /** @type {Map<string, Function>} */
        this.routes = new Map();
        this._currentPage = null;

        window.addEventListener('popstate', () => this._handleRoute());
        document.addEventListener('click', (e) => this._handleLinkClick(e));
    }

    /**
     * Регистрирует маршрут
     * @param {string} path - URL-путь
     * @param {Function} pageFactory - фабрика, возвращающая экземпляр страницы
     * @returns {Router}
     */
    addRoute(path, pageFactory) {
        this.routes.set(path, pageFactory);
        return this; // для chaining
    }

    /**
     * Программная навигация
     * @param {string} path
     */
    navigate(path) {
        if (window.location.pathname === path) return;
        window.history.pushState({}, '', path);
        this._handleRoute();
    }

    /**
     * Перехват кликов по ссылкам с data-link
     * @param {Event} e
     * @private
     */
    _handleLinkClick(e) {
        const link = e.target.closest('[data-link]');
        if (!link) return;
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
    }

    /**
     * Обработка текущего маршрута
     * @private
     */
    async _handleRoute() {
        const path = window.location.pathname;
        const pageFactory = this.routes.get(path) || this.routes.get('/404');

        // Уничтожаем предыдущую страницу (cleanup)
        if (this._currentPage?.destroy) {
            this._currentPage.destroy();
        }

        const page = pageFactory();
        this._currentPage = page;
        this.root.innerHTML = '';
        await page.render(this.root);
    }

    /** Запуск роутера */
    start() {
        this._handleRoute();
    }
}
