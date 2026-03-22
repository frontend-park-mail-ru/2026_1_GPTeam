import { BaseComponent } from "../base_component.js";
import template from "./header.hbs?raw";
import "./header.css";
import { get_profile } from "../../api/profile.js";
import type { SimpleResponse } from "../../types/interfaces.js";

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
        const nav = document.getElementsByTagName("a");
        for (const elem of nav) {
            if (elem.getAttribute("href") === this._props.cur_page) {
                elem.classList.add("active_header_link");
                if (this._props.cur_page === "/profile") {
                    const icon = elem.getElementsByTagName("img")[0];
                    if (icon) icon.src = "/icons/profile_active.svg";
                    elem.classList.remove("profile_icon");
                    elem.classList.add("profile_icon_active");
                }
            }
        }

        this._loadAvatar();
    }

    private async _loadAvatar(): Promise<void> {
        try {
            const data = await get_profile() as ProfileApiResponse;
            if (data.code !== 200 || !data.user?.avatar_url) return;

            const profileLink = document.querySelector<HTMLAnchorElement>("a[href='/profile']");
            if (!profileLink) return;

            const icon = profileLink.querySelector<HTMLImageElement>("img");
            if (!icon) return;

            const img = new Image();
            img.onload = () => {
                icon.src = data.user.avatar_url;
                icon.style.width = "32px";
                icon.style.height = "32px";
                icon.style.borderRadius = "50%";
                icon.style.objectFit = "cover";
            };
            img.src = data.user.avatar_url;
        } catch {
        }
    }
}