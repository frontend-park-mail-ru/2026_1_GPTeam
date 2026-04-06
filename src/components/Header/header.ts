import { BaseComponent } from "../base_component.ts";
import template from "./header.hbs?raw";
import "./header.scss";
import { get_profile } from "../../api/profile.ts";
import type { SimpleResponse } from "../../types/interfaces.ts";

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
    constructor(props: HeaderProps) {
        super(template, props);
    }

    protected _afterRender(): void {
        this.updateActiveLink(this._props.cur_page as string);
        this._loadAvatar();
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

    private async _loadAvatar(): Promise<void> {
        try {
            const data = await get_profile() as ProfileApiResponse;
            if (data.code !== 200 || !data.user?.avatar_url) return;

            const profileLink = this._element?.querySelector<HTMLAnchorElement>("a[href='/profile']");
            if (!profileLink) return;

            const icon = profileLink.querySelector<HTMLImageElement>("img");
            if (!icon) return;

            const avatarUrl = `${import.meta.env.VITE_SERVER_URL}/img/${data.user.avatar_url}`

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
        }
    }
}