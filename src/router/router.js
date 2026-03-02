export class Router {
    constructor(root) {
        this.root = root;
        this.routes = new Map();
        this._currentPage = null;

        window.addEventListener("popstate", () => this._handleRoute());
        document.addEventListener("click", (e) => this._handleLinkClick(e));
    }

    addRoute(path, pageFactory) {
        this.routes.set(path, pageFactory);
        return this;
    }

    navigate(path) {
        if (window.location.pathname === path) return;
        window.history.pushState({}, "", path);
        this._handleRoute();
    }

    _handleLinkClick(e) {
        const link = e.target.closest("[data-link]");
        if (!link) return;
        e.preventDefault();
        this.navigate(link.getAttribute("href"));
    }

    async _handleRoute() {
        const path = window.location.pathname;
        const pageFactory = this.routes.get(path) || this.routes.get("/404");

        if (this._currentPage?.destroy) {
            this._currentPage.destroy();
        }

        const page = pageFactory();
        this._currentPage = page;
        this.root.innerHTML = "";
        await page.render(this.root);
    }

    start() {
        this._handleRoute();
    }
}
