import { BaseComponent } from "../base_component.js";
import template from "./profile_info.hbs?raw";
import "./profile_info.css";
import type { User } from "../../types/interfaces.js";

/** Props для компонента ProfileInfo. */
interface ProfileInfoProps {
    username: User["username"];
    email: User["email"];
    created_at: User["created_at"];
}

/**
 * Компонент карточек с информацией профиля.
 * Отображает логин, email и дату регистрации пользователя.
 *
 * @class ProfileInfo
 * @extends BaseComponent
 *
 * @example
 * const info = new ProfileInfo({ username: "ivan", email: "ivan@mail.ru", created_at: "1 января 2026" });
 * info.render(document.querySelector(".profile__info"));
 */
export class ProfileInfo extends BaseComponent {
    /**
     * @param {ProfileInfoProps} props - Данные пользователя для отображения.
     */
    constructor(props: ProfileInfoProps) {
        super(template, { ...props });
    }
}