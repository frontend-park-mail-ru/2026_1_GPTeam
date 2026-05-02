import { BaseComponent } from "../base_component.ts";
import template from "./ads_banner.hbs?raw";
import "./ads_banner.scss";

/**
 * Компонент рекламных баннеров.
 * Отображает iframe-рекламу слева и справа от основного контента.
 *
 * @class AdsBanner
 * @extends BaseComponent
 */
export class AdsBanner extends BaseComponent {
    constructor() {
        const adUrl = import.meta.env.VITE_ADVERTISEMENT_URL || "https://example.com";
        super(template, { adUrl });
    }
}
