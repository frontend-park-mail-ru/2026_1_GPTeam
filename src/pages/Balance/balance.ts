import { BasePage } from "../base_page.ts";
import template from "./balance.hbs?raw";
import { get_balance } from "../../api/balance.ts";
import { TotalBalance } from "../../components/TotalBalance/total_balance.ts";
import { IncomeBalance } from "../../components/IncomeBalance/income_balance.ts";
import { ExpensesBalance } from "../../components/ExpensesBalance/expenses_balance.ts";
import { router } from "../../router/router_instance.ts";
import Handlebars from "handlebars";
import type { BalanceResponse as BalanceResponseType } from "../../types/interfaces.ts";
import "./balance.css";

/**
 * Страница отображения баланса с фильтрацией по валютам (RUB, USD, EUR).
 */
export class BalancePage extends BasePage {
  /**
   * Загружает данные, рендерит основной шаблон и инициализирует компоненты для каждой валюты.
   * @param root Контейнер для отрисовки.
   */
  async render(root: HTMLElement): Promise<void> {
    const response = await get_balance() as BalanceResponseType;

    if (response.code === 401) {
      router.navigate("/login");
      return;
    }

    const compiledTemplate = Handlebars.compile(template);
    root.innerHTML = `
      <div class="page">
        <main class="page__content">${compiledTemplate({ date: response.date }).trim()}</main>
      </div>
    `;

    const balanceContent = root.querySelector<HTMLElement>(".balance-content")!;

    response.balances.forEach((item, index) => {
        const section = document.createElement('div');
        section.className = 'currency-section';
        section.setAttribute('data-currency', item.currency);

        section.innerHTML = `
            <h3 class="currency-label">${item.currency}</h3>
            <div class="main-row-${index}"></div>
            <div class="row row-${index}"></div>
            <hr class="balance-divider">
        `;
        balanceContent.appendChild(section);

        const total = new TotalBalance({
          balance: item.balance,
          currency: item.currency,
        });
        total.render(section.querySelector<HTMLElement>(`.main-row-${index}`)!);
        this._components.push(total);

        const income = new IncomeBalance({
          amount: item.income,
          currency: item.currency,
        });
        income.render(section.querySelector<HTMLElement>(`.row-${index}`)!);
        this._components.push(income);

        const expenses = new ExpensesBalance({
          amount: item.expenses,
          currency: item.currency,
        });
        expenses.render(section.querySelector<HTMLElement>(`.row-${index}`)!);
        this._components.push(expenses);
    });

    this._initFilters(root);
  }

  /**
   * Настраивает логику переключения фильтров валют.
   * @param root Корневой элемент страницы.
   */
  private _initFilters(root: HTMLElement): void {
    const filterButtons = root.querySelectorAll('.filter-btn');
    const sections = root.querySelectorAll<HTMLElement>('.currency-section');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedCurrency = btn.getAttribute('data-currency');

        root.querySelector('.filter-btn.active')?.classList.remove('active');
        btn.classList.add('active');

        sections.forEach(section => {
          const currency = section.getAttribute('data-currency');
          if (selectedCurrency === 'all' || currency === selectedCurrency) {
            section.style.display = 'block';
          } else {
            section.style.display = 'none';
          }
        });
      });
    });
  }
}
