import template from "./support.hbs?raw";
import { BaseComponent } from "../src/components/base_component.ts";
import "./support.scss";

const supportUrl: string = import.meta.env.VITE_SUPPORT_IFRAME_URL ?? "";

/**
 * Плавающая кнопка с меню: пункт «Сделать обращение» открывает панель справа с iframe
 * техподдержки без затемнения остального экрана. Без бэкдропа.
 */
export class SupportWidget extends BaseComponent {
    private _menuOpen: boolean;
    private _boundDocClick: (e: MouseEvent) => void;
    private _iframeSrcSet: boolean;

    constructor() {
        super(template, {});
        this._menuOpen = false;
        this._iframeSrcSet = false;
        this._boundDocClick = this._onDocumentClick.bind(this);
    }

    protected override _afterRender(): void {
        document.addEventListener("click", this._boundDocClick, true);
    }

    protected override _addEventListeners(): void {
        const el = this.getElement();
        if (!el) return;

        const toggle = el.querySelector<HTMLButtonElement>("[data-support-toggle]");
        const menu = el.querySelector<HTMLElement>("[data-support-menu]");
        const openTicket = el.querySelector<HTMLButtonElement>("[data-open-ticket]");
        const closeBtn = el.querySelector<HTMLButtonElement>("[data-support-close]");
        const panel = el.querySelector<HTMLElement>("[data-support-panel]");

        if (toggle && menu) {
            this._on(toggle, "click", (e) => {
                e.stopPropagation();
                this._menuOpen = !this._menuOpen;
                this._applyMenuState(menu, toggle);
            });
        }

        if (openTicket && menu && panel && toggle) {
            this._on(openTicket, "click", (e) => {
                e.stopPropagation();
                this._openPanel(el, panel, menu, toggle);
            });
        }

        if (closeBtn && panel) {
            this._on(closeBtn, "click", () => {
                this._closePanel(el, panel);
            });
        }
    }

    private _onDocumentClick(e: MouseEvent): void {
        const el = this.getElement();
        if (!el) return;
        if (e.target instanceof Node && el.contains(e.target)) {
            return;
        }
        const menu = el.querySelector<HTMLElement>("[data-support-menu]");
        const toggle = el.querySelector<HTMLButtonElement>("[data-support-toggle]");
        if (menu && !menu.hidden) {
            this._menuOpen = false;
            if (toggle) this._applyMenuState(menu, toggle);
        }
    }

    private _applyMenuState(menu: HTMLElement, toggle: HTMLButtonElement): void {
        menu.hidden = !this._menuOpen;
        toggle.setAttribute("aria-expanded", this._menuOpen ? "true" : "false");
    }

    private _openPanel(
        root: HTMLElement,
        panel: HTMLElement,
        menu: HTMLElement,
        toggle: HTMLButtonElement,
    ): void {
        const iframe = root.querySelector<HTMLIFrameElement>("[data-support-iframe]");
        if (iframe) {
            if (supportUrl && !this._iframeSrcSet) {
                iframe.src = supportUrl;
                this._iframeSrcSet = true;
            }
        }

        this._menuOpen = false;
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");

        root.classList.add("support-widget--open");
        panel.setAttribute("aria-hidden", "false");
    }

    private _closePanel(root: HTMLElement, panel: HTMLElement): void {
        root.classList.remove("support-widget--open");
        panel.setAttribute("aria-hidden", "true");
    }

    override destroy(): void {
        document.removeEventListener("click", this._boundDocClick, true);
        super.destroy();
    }
}

export function initSupportWidget(container: HTMLElement): SupportWidget {
    const w = new SupportWidget();
    w.render(container);
    return w;
}
