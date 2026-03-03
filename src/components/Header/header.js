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
            if (elem.getAttribute("href") === this._props.cur_page)
                elem.classList.add("active_header_link");
    }
}
