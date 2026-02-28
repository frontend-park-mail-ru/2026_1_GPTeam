export class BasePage {
    constructor() {
        this._components = [];
    }

    async render(root) {

    }

    destroy() {
        this._components.forEach((c) => c.destroy());
        this._components = [];
    }
}
