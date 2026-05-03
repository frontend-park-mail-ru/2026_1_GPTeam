import {BasePage} from "../base_page.ts";
import template from "./budget_edit.hbs?raw";
import "./budget_edit.scss";
import {BudgetEditForm} from "../../components/BudgetEditForm/budget_edit_form.ts";
import {get_budget} from "../../api/budget.ts";
import {BudgetGetResponse} from "../../types/interfaces.ts";
import {router} from "../../router/router_instance.ts";

export class BudgetEditPage extends BasePage {
    private _id: number;

    constructor(id: number) {
        super();
        this._id = id;
    }

    async render(root: HTMLElement): Promise<void> {
        root.innerHTML = `
            <div class="page">
                <main class="page__content">${template}</main>
            </div>
        `;

        let data: BudgetGetResponse = await get_budget(this._id);
        if (data.code === 401) {
            router.navigate("/login");
            return;
        }
        if (data.code !== 200) {
            await this.show_error(root, data.message ? data.message : "Ошибка сервера");
            return
        }

        let edit_form: BudgetEditForm = new BudgetEditForm({
            title: data.budget.title,
            description: data.budget.description,
            target: data.budget.target,
        }, this._id);
        let edit_form_container = root.querySelector<HTMLElement>("#form__container")!;
        edit_form.render(edit_form_container);
    }

    async show_error(root: HTMLElement, message: string): Promise<void> {
        let elem = root.querySelector("#form__container")!;
        elem.innerHTML = `${message}`;
    }
}
