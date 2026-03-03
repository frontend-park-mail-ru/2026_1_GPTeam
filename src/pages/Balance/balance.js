import {BasePage} from "../base_page.js";
import template from "./balance.hbs?raw";
import {is_login} from "../../api/auth.js";
import {Header} from "../../components/Header/header.js";
import {get_balance} from "../../api/balance.js";
import {TotalBalance} from "../../components/TotalBalance/total_balace.js";
import "./balance.css";
import Handlebars from "handlebars";
import {IncomeBalance} from "../../components/IncomeBalance/income_balance.js";
import {ExpensesBalance} from "../../components/ExpensesBalance/expenses_balance.js";

export class BalancePage extends BasePage {
    async render(root) {
        let data = await is_login();
        if (data["code"] !== 200) {
            window.location.href = "/login";  // ToDo: navigate
            return;
        }

        let balance = await get_balance();

        let compiledTemplate = Handlebars.compile(template)
        let html = compiledTemplate({
            date: balance["date"],
        }).trim();
        root.innerHTML = `
      <div class="page">
        <header class="page__header"></header>
        <main class="page__content">${html}</main>
      </div>
    `;

        const header = new Header({
            cur_page: "/balance",
        });
        header.render(root.querySelector(".page__header"));
        this._components.push(header);

        const total_balance = new TotalBalance({
            balance: balance["balance"],
            currency: balance["currency"],
        });
        total_balance.render(root.querySelector(".main_row"));
        this._components.push(total_balance);

        const income_balance = new IncomeBalance({
            balance: balance["income"],
            currency: balance["currency"],
        });
        income_balance.render(root.querySelector(".row"));
        this._components.push(income_balance);

        const expenses_balance = new ExpensesBalance({
            balance: balance["expenses"],
            currency: balance["currency"],
        });
        expenses_balance.render(root.querySelector(".row"));
        this._components.push(expenses_balance);
    }
}