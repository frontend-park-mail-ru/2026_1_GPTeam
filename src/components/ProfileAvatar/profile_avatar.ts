import { BaseComponent } from "../base_component.ts";
import template from "./profile_avatar.hbs?raw";
import "./profile_avatar.scss";
import type { User } from "../../types/interfaces.ts";

/** Props для компонента ProfileAvatar. */
interface ProfileAvatarProps {
    username: User["username"];
    email: User["email"];
    avatar_url: string;
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
    constructor(props: ProfileAvatarProps) {
        console.log(props);
        const initials = props.username
            ? props.username.slice(0, 2).toUpperCase()
            : "??";
        super(template, { ...props, initials });
    }
}