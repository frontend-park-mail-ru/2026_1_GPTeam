import { BaseComponent } from "../base_component.ts";
import template from "./profile_avatar.hbs?raw";
import "./profile_avatar.css";
import type { User } from "../../types/interfaces.ts";

/** Props для компонента ProfileAvatar. */
interface ProfileAvatarProps {
    username: User["username"];
    email: User["email"];
}

/**
 * Компонент аватарки профиля.
 * Отображает инициалы пользователя, его имя и email.
 *
 * @class ProfileAvatar
 * @extends BaseComponent
 *
 * @example
 * const avatar = new ProfileAvatar({ username: "ivan", email: "ivan@mail.ru" });
 * avatar.render(document.querySelector(".profile__avatar"));
 */
export class ProfileAvatar extends BaseComponent {
    /**
     * @param {ProfileAvatarProps} props - Имя пользователя и email.
     */
    constructor(props: ProfileAvatarProps) {
        const initials = props.username.slice(0, 2).toUpperCase();
        super(template, { ...props, initials });
    }
}