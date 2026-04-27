import { BaseComponent } from "../base_component.ts";
import template from "./header.hbs?raw";
import "./header.scss";
import { get_profile } from "../../api/profile.ts";
import type { SimpleResponse } from "../../types/interfaces.ts";

/** Событие после успешной загрузки аватара — хедер подписан и обновляет превью без перезагрузки страницы */
export const AVATAR_UPDATED_EVENT = "avatar-updated";

interface HeaderProps extends Record<string, unknown> {
    cur_page: string;
}

interface ProfileApiResponse extends SimpleResponse {
    user: {
        username: string;
        email: string;
        created_at: string;
        avatar_url: string;
    };
}

/**
 * Компонент шапки сайта (навигации).
 * Отвечает за отображение верхнего меню и автоматическую подсветку
 * текущей активной ссылки на основе переданного пути.
 * Если у пользователя есть аватар — показывает его в хедере вместо иконки.
 *
 * @class Header
 * @extends BaseComponent
 */
export class Header extends BaseComponent {
    private readonly _onAvatarUpdated = (): void => {
        void this._loadAvatar(true);
    };

    constructor(props: HeaderProps) {
        super(template, props);
    }

    destroy(): void {
        window.removeEventListener(AVATAR_UPDATED_EVENT, this._onAvatarUpdated);
        this._closeMenu(); // закрываем меню при уничтожении компонента
        super.destroy();
    }

    protected _afterRender(): void {
        this.updateActiveLink(this._props.cur_page as string);
        window.removeEventListener(AVATAR_UPDATED_EVENT, this._onAvatarUpdated);
        window.addEventListener(AVATAR_UPDATED_EVENT, this._onAvatarUpdated);
        void this._loadAvatar(false);
        this._initBurgerMenu();
    }

    updateActiveLink(path: string): void {
        if (!this._element) return;

        const links = this._element.querySelectorAll<HTMLAnchorElement>("a");

        for (const link of links) {
            link.classList.remove("header__link--active");

            if (link.getAttribute("href") === "/profile") {
                link.classList.remove("header__link--profile-active");
                const icon = link.querySelector<HTMLImageElement>("img");
                if (icon && icon.src.endsWith("/icons/profile_active.svg")) {
                    icon.src = "/icons/profile.svg";
                }
            }
        }

        for (const link of links) {
            if (link.getAttribute("href") === path) {
                link.classList.add("header__link--active");
                if (path === "/profile") {
                    link.classList.add("header__link--profile-active");
                    const icon = link.querySelector<HTMLImageElement>("img");
                    if (icon && icon.src.endsWith("/icons/profile.svg")) {
                        icon.src = "/icons/profile_active.svg";
                    }
                }
            }
        }
    }

    // ─── Приватные хелперы управления меню ───────────────────────────────────

    private _openMenu(): void {
        const burger  = this._element?.querySelector<HTMLButtonElement>(".header__burger");
        const nav     = this._element?.querySelector<HTMLElement>(".header__nav");
        const overlay = this._element?.querySelector<HTMLElement>(".header__overlay");

        burger?.classList.add("header__burger--active");
        nav?.classList.add("header__nav--open");
        overlay?.classList.add("header__overlay--visible");
        document.body.style.overflow = "hidden";
    }

    private _closeMenu(): void {
        const burger  = this._element?.querySelector<HTMLButtonElement>(".header__burger");
        const nav     = this._element?.querySelector<HTMLElement>(".header__nav");
        const overlay = this._element?.querySelector<HTMLElement>(".header__overlay");

        burger?.classList.remove("header__burger--active");
        nav?.classList.remove("header__nav--open");
        overlay?.classList.remove("header__overlay--visible");
        document.body.style.overflow = "";
    }

    private _isMenuOpen(): boolean {
        return this._element
            ?.querySelector(".header__nav")
            ?.classList.contains("header__nav--open") ?? false;
    }

    // ─── Инициализация бургер-меню ───────────────────────────────────────────

    private _initBurgerMenu(): void {
        const burger  = this._element?.querySelector<HTMLButtonElement>(".header__burger");
        const nav     = this._element?.querySelector<HTMLElement>(".header__nav");
        const overlay = this._element?.querySelector<HTMLElement>(".header__overlay");

        if (!burger || !nav || !overlay) return;

        // Открытие / закрытие по клику на бургер
        this._on(burger, "click", () => {
            this._isMenuOpen() ? this._closeMenu() : this._openMenu();
        });

        // Закрытие по клику на оверлей
        this._on(overlay, "click", () => {
            this._closeMenu();
        });

        // Закрытие при переходе по ссылке внутри nav
        this._on(nav, "click", (e) => {
            const target = e.target as HTMLElement;
            if (target.closest("a")) {
                this._closeMenu();
            }
        });

        // Закрытие по Escape
        this._on(document as unknown as HTMLElement, "keydown", (e) => {
            if ((e as KeyboardEvent).key === "Escape" && this._isMenuOpen()) {
                this._closeMenu();
            }
        });
    }

    // ─── Загрузка аватара ────────────────────────────────────────────────────

    private async _loadAvatar(cacheBust: boolean): Promise<void> {
        try {
            const data = await get_profile() as ProfileApiResponse;
            if (data.code !== 200 || !data.user?.avatar_url) return;

            const profileLink = this._element?.querySelector<HTMLAnchorElement>("a[href='/profile']");
            if (!profileLink) return;

            const icon = profileLink.querySelector<HTMLImageElement>("img");
            if (!icon) return;

            const base = data.user.avatar_url.startsWith("http")
                ? data.user.avatar_url
                : `${import.meta.env.VITE_SERVER_URL}/img/${data.user.avatar_url}`;
            const avatarUrl = cacheBust
                ? `${base}${base.includes("?") ? "&" : "?"}t=${Date.now()}`
                : base;

            const img = new Image();
            img.onload = () => {
                icon.src = avatarUrl;
                icon.style.width = "32px";
                icon.style.height = "32px";
                icon.style.borderRadius = "50%";
                icon.style.objectFit = "cover";
            };
            img.src = avatarUrl;
        } catch {
            // аватар недоступен — оставляем дефолтную иконку
        }
    }
}