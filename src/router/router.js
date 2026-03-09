/**
 * Класс для управления маршрутизацией страниц (SPA Router).
 * Обеспечивает навигацию без перезагрузки страницы, обрабатывает клики по ссылкам 
 * с атрибутом [data-link] и синхронизирует состояние с историей браузера.
 * * @class Router
 */
export class Router {
    /**
     * Создает экземпляр роутера.
     * @param {HTMLElement} root - Контейнер, в который будут рендериться все страницы приложения.
     */
    constructor(root) {
        /** @private */
        this.root = root;
        /** @private @type {Map<string, Function>} */
        this.routes = new Map();
        /** @private @type {Object|null} */
        this._currentPage = null;

        // Обработка кнопок "Назад/Вперед" в браузере
        window.addEventListener("popstate", () => this._handleRoute());
        
        // Глобальное делегирование кликов для навигации
        document.addEventListener("click", (e) => this._handleLinkClick(e));
    }

    /**
     * Регистрирует новый маршрут в приложении.
     * * @param {string} path - URL путь (например, '/profile').
     * @param {Function} pageFactory - Функция-фабрика, возвращающая экземпляр класса страницы (наследника BasePage).
     * @returns {Router} Текущий экземпляр роутера для поддержки цепочки вызовов (Chaining).
     * * @example
     * router.addRoute('/login', () => new LoginPage())
     * .addRoute('/profile', () => new ProfilePage());
     */
    addRoute(path, pageFactory) {
        this.routes.set(path, pageFactory);
        return this;
    }

    /**
     * Переходит по указанному пути, обновляя историю браузера.
     * Если путь совпадает с текущим, переход игнорируется.
     * * @param {string} path - Путь для перехода.
     * @returns {void}
     */
    navigate(path) {
        if (window.location.pathname === path) return;
        window.history.pushState({}, "", path);
        this._handleRoute();
    }

    /**
     * Принудительно перезагружает текущий маршрут.
     * Полезно после успешных POST-запросов (например, создания бюджета) для обновления данных.
     * @returns {void}
     */
    refresh() {
        this._handleRoute();
    }
    
    /**
     * Перехватывает клики по элементам с атрибутом `data-link`.
     * Предотвращает стандартную перезагрузку страницы и использует внутреннюю навигацию.
     * * @private
     * @param {MouseEvent} e - Объект события клика.
     * @returns {void}
     */
    _handleLinkClick(e) {
        const link = e.target.closest("[data-link]");
        if (!link) return;
        e.preventDefault();
        this.navigate(link.getAttribute("href"));
    }

    /**
     * Основная логика смены страниц.
     * 1. Вызывает destroy() у текущей страницы для очистки памяти и событий.
     * 2. Определяет фабрику для текущего URL (или 404).
     * 3. Создает и асинхронно рендерит новую страницу.
     * * @private
     * @async
     * @returns {Promise<void>}
     */
    async _handleRoute() {
        const path = window.location.pathname;
        const pageFactory = this.routes.get(path) || this.routes.get("/404");

        // Важный этап очистки: предотвращает утечки памяти и дублирование событий
        if (this._currentPage?.destroy) {
            this._currentPage.destroy();
        }

        const page = pageFactory();
        this._currentPage = page;
        this.root.innerHTML = "";
        await page.render(this.root);
    }

    /**
     * Запускает роутер при первичной загрузке приложения.
     * Анализирует текущий URL и отрисовывает соответствующую страницу.
     * @returns {void}
     */
    start() {
        this._handleRoute();
    }
}