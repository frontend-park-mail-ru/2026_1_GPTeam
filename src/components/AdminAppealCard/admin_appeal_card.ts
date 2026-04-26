import { BaseComponent } from "../base_component.ts";
import template from "./admin_appeal_card.hbs?raw";
import "./admin_appeal_card.scss";
import type { AppealCardProps } from "../../types/interfaces.ts";
import { router } from "../../router/router_instance.ts";

export class AdminAppealCard extends BaseComponent {
    constructor(props: AppealCardProps) {
        super(template, props);
    }

    protected override _addEventListeners(): void {
        const el = this.getElement();
        if (el) {
            el.style.cursor = "pointer";
        }

        this._delegate("click", ".appeal-card", (e) => {
            e.preventDefault();
            const id = this._props.id;
            router.navigate(`/admin/appeals/${id}`);
        });
    }
}
