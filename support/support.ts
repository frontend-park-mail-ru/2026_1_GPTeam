import template from "./support.hbs?raw";
import { BaseComponent } from "../src/components/base_component.ts";
import "./support.scss";
import {router} from "../src/router/router_instance.ts";

const IFRAME_SRC_ENV = (import.meta.env.VITE_SUPPORT_IFRAME_URL as string | undefined)?.trim();
const IFRAME_FALLBACK = "/support/support-form.html";
const SUPPORT_IFRAME_URL = IFRAME_SRC_ENV && IFRAME_SRC_ENV.length > 0 ? IFRAME_SRC_ENV : IFRAME_FALLBACK;


/**
 * Кнопка «Помощь» — открывает/сворачивает правую панель с iframe; «×» — сворачивает.
 * URL iframe: VITE_SUPPORT_IFRAME_URL или встроенная форма public/support-form.html
 */
export class SupportWidget extends BaseComponent {
    private _menuOpen = false;
    private _iframeSrcSet = false;
    private readonly _boundDocClick: (e: MouseEvent) => void;
    private readonly _boundPostMessage: (ev: MessageEvent) => void;

    constructor() {
        super(template, {});
        this._boundDocClick = this._onDocumentClick.bind(this);
        this._boundPostMessage = this._onIframePostMessage.bind(this);
    }

    protected override _afterRender(): void {
        document.addEventListener("click", this._boundDocClick, true);
        window.addEventListener("message", this._boundPostMessage);
    }

    private _onIframePostMessage(ev: MessageEvent): void {
        if (ev.origin !== window.location.origin) return;
        const d = ev.data as { source?: string; kind?: string; body?: string };
        if (d?.source !== "support-form.html" || d?.kind !== "appeal-submit-json" || typeof d.body !== "string") {
            return;
        }
        console.log("[support.ts]", d.body);
    }

    protected override _addEventListeners(): void {
        const el = this.getElement();
        if (!el) return;

        const toggle = el.querySelector<HTMLButtonElement>("[data-support-toggle]");
        const menu = el.querySelector<HTMLElement>("[data-support-menu]");
        const openTicket = el.querySelector<HTMLButtonElement>("[data-open-ticket]");
        const myAppeals = el.querySelector<HTMLButtonElement>("[data-my-appeals]");
        const closeBtn = el.querySelector<HTMLButtonElement>("[data-support-close]");
        const panel = el.querySelector<HTMLElement>("[data-support-panel]");

        if (toggle && menu) {
            this._on(toggle, "click", (e) => {
                e.stopPropagation();
                if (panel && el.classList.contains("support-widget--open")) {
                    this._closePanel(el, panel);
                }
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

        if (myAppeals && menu && toggle && panel) {
            this._on(myAppeals, "click", (e) => {
                e.stopPropagation();
                this._menuOpen = false;
                this._applyMenuState(menu, toggle);
                this._closePanel(el, panel);
                router.navigate("/my_appeals");
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
        const panel = el.querySelector<HTMLElement>("[data-support-panel]");

        if (menu && !menu.hidden) {
            this._menuOpen = false;
            if (toggle) this._applyMenuState(menu, toggle);
        }

        if (panel && el.classList.contains("support-widget--open")) {
            this._closePanel(el, panel);
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
        if (iframe && !this._iframeSrcSet) {
            iframe.src = SUPPORT_IFRAME_URL;
            this._iframeSrcSet = true;
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
        window.removeEventListener("message", this._boundPostMessage);
        super.destroy();
    }
}


export function initSupportWidget(container: HTMLElement): SupportWidget {
    const w = new SupportWidget();
    w.render(container);
    return w;
}
