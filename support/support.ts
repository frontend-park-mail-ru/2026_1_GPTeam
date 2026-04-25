import template from "./support.hbs?raw";
import { BaseComponent } from "../src/components/base_component.ts";
import { router } from "../src/router/router_instance.ts"; // <-- ДОБАВИЛИ ИМПОРТ РОУТЕРА
import "./support.scss";

const IFRAME_SRC_ENV = (import.meta.env.VITE_SUPPORT_IFRAME_URL as string | undefined)?.trim();
const IFRAME_FALLBACK = "/support-form.html";

/**
 * Кнопка «Помощь» — открывает/сворачивает правую панель с iframe; «×» — сворачивает.
 * URL iframe: VITE_SUPPORT_IFRAME_URL или встроенная форма public/support-form.html
 */
export class SupportWidget extends BaseComponent {
    private _iframeUrlApplied: boolean;

    constructor() {
        super(template, {});
        this._iframeUrlApplied = false;
    }

    protected override _addEventListeners(): void {
        const el = this.getElement();
        if (!el) return;

        const panel = el.querySelector<HTMLElement>("[data-support-panel]");
        const toggle = el.querySelector<HTMLButtonElement>("[data-support-toggle]");
        const closeBtn = el.querySelector<HTMLButtonElement>("[data-support-close]");

        if (panel && toggle) {
            this._on(toggle, "click", (e) => {
                e.stopPropagation();
                const willOpen = !el.classList.contains("support-widget--open");
                this._setOpen(el, panel, toggle, willOpen);
            });
        }

        if (closeBtn && panel && toggle) {
            this._on(closeBtn, "click", () => {
                this._setOpen(el, panel, toggle, false);
            });
        }
    }

    private _setIframeSrc(root: HTMLElement): void {
        if (this._iframeUrlApplied) return;
        const iframe = root.querySelector<HTMLIFrameElement>("[data-support-iframe]");
        if (!iframe) return;
        iframe.src = IFRAME_SRC_ENV && IFRAME_SRC_ENV.length > 0 ? IFRAME_SRC_ENV : IFRAME_FALLBACK;
        this._iframeUrlApplied = true;
    }

    private _setOpen(
        root: HTMLElement,
        panel: HTMLElement,
        toggle: HTMLButtonElement,
        open: boolean,
    ): void {
        if (open) {
            this._setIframeSrc(root);
            root.classList.add("support-widget--open");
            panel.setAttribute("aria-hidden", "false");
            toggle.setAttribute("aria-expanded", "true");
        } else {
            root.classList.remove("support-widget--open");
            panel.setAttribute("aria-hidden", "true");
            toggle.setAttribute("aria-expanded", "false");
        }
    }
}

export function initSupportWidget(container: HTMLElement): SupportWidget {
    const w = new SupportWidget();
    w.render(container);
    return w;
}
