import { BaseComponent } from "../base_component.js";
import template from "./header.hbs?raw";
import "./header.css";

export class Header extends BaseComponent {
    constructor(props) {
        super(template, props);
    }

    _afterRender() {
        let nav = document.getElementsByTagName("a");
        for (let elem of nav)
            if (elem.getAttribute("href") === this._props.cur_page) {
                elem.classList.add("active_header_link");
                if (this._props.cur_page === "/profile") {
                    let icon = elem.getElementsByTagName("img")[0];
                    icon.src = "/icons/profile_active.svg";
                    elem.classList.remove("profile_icon");
                    elem.classList.add("profile_icon_active");
                }
            }
    }
}
