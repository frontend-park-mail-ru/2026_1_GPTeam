import { BasePage } from "../base_page.ts";
import template from "./analysis.hbs?raw";
import Handlebars from "handlebars";
import { fetchAnalysis } from "../../api/analysis.ts";
import { router } from "../../router/router_instance.ts";
import type {
    AnalysisBudgetItem,
    AnalysisCategoryItem,
    AnalysisPeriod,
    AnalysisResponse,
    AnalysisTimelineItem,
} from "../../types/interfaces.ts";
import "./analysis.scss";

const DONUT_COLORS = ["#484FFF", "#7A7FFF", "#A4A8FF", "#8B8FA8"];
const MAX_DONUT_ITEMS = 4;

export class AnalysisPage extends BasePage {
    private _selectedPeriod: AnalysisPeriod = "month";
    private _selectedStartDate = "";

    async render(root: HTMLElement): Promise<void> {
        const compiledTemplate = Handlebars.compile(template);
        root.innerHTML = `
            <div class="page">
                <main class="page__content page__content--analysis">${compiledTemplate({}).trim()}</main>
            </div>
        `;

        this._bindFilters(root);
        await this._loadAndRender(root);
    }

    private _bindFilters(root: HTMLElement): void {
        const buttons = root.querySelectorAll<HTMLButtonElement>(".js--analysis-period");
        buttons.forEach((button) => {
            button.addEventListener("click", async () => {
                const period = (button.dataset.period ?? "month") as AnalysisPeriod;
                if (period === this._selectedPeriod) return;
                this._selectedPeriod = period;
                this._syncPeriodButtons(root);
                await this._loadAndRender(root);
            });
        });

        const startDateInput = root.querySelector<HTMLInputElement>(".js--analysis-start-date");
        startDateInput?.addEventListener("change", async () => {
            this._selectedStartDate = startDateInput.value;
            await this._loadAndRender(root);
        });
    }

    private _syncPeriodButtons(root: HTMLElement): void {
        const buttons = root.querySelectorAll<HTMLButtonElement>(".js--analysis-period");
        buttons.forEach((button) => {
            button.classList.toggle("analysis__filter--active", button.dataset.period === this._selectedPeriod);
        });
    }

    private async _loadAndRender(root: HTMLElement): Promise<void> {
        const errorBox = root.querySelector<HTMLElement>(".js--analysis-error");
        if (errorBox) {
            errorBox.hidden = true;
            errorBox.textContent = "";
        }

        try {
            const data: AnalysisResponse = await fetchAnalysis(this._selectedPeriod, this._selectedStartDate || undefined);
            if (data.code === 401) {
                router.navigate("/login");
                return;
            }
            this._renderData(root, data);
        } catch (e) {
            console.error(e);
            this._showError(root, "Не удалось загрузить аналитику.");
            this._renderData(root, this._emptyAnalysisResponse());
        }
    }

    private _renderData(root: HTMLElement, data: AnalysisResponse): void {
        const periodLabel = root.querySelector<HTMLElement>(".js--analysis-period-label");
        if (periodLabel) {
            periodLabel.textContent = data.period_label || "Период";
        }

        const kpiContainer = root.querySelector<HTMLElement>(".js--analysis-kpis");
        if (kpiContainer) {
            const kpis = [
                {
                    label: "Сумма лимитов",
                    value: this._formatMoney(data.summary.total_budget_limit),
                    hint: "Суммарный план по бюджетам",
                },
                {
                    label: "Потрачено",
                    value: this._formatMoney(data.summary.total_budget_spent),
                    hint: "Фактические траты по бюджетам",
                },
                {
                    label: "Остаток лимитов",
                    value: this._formatMoney(data.summary.total_budget_free),
                    hint: "Свободный резерв",
                },
                {
                    label: "Чистый результат",
                    value: this._formatMoney(data.summary.savings),
                    hint: `Доходы ${this._formatMoney(data.summary.income_total)} / Расходы ${this._formatMoney(data.summary.expense_total)}`,
                },
            ];
            kpiContainer.innerHTML = kpis.map((item) => `
                <article class="analysis-kpi">
                    <p class="analysis-kpi__label">${item.label}</p>
                    <p class="analysis-kpi__value">${item.value}</p>
                    <p class="analysis-kpi__hint">${item.hint}</p>
                </article>
            `).join("");
        }

        const budgetsByLimit = this._sortBudgetsByLimit(data.budgets);
        this._renderBudgetChart(root, budgetsByLimit);
        this._renderBudgetList(root, budgetsByLimit);
        this._renderDonut(root, data.categories, data.summary.expense_total);
        this._renderLineChart(root, data.timeline);
    }

    private _renderBudgetChart(root: HTMLElement, budgets: AnalysisBudgetItem[]): void {
        const container = root.querySelector<HTMLElement>(".js--analysis-budget-chart");
        if (!container) return;

        if (budgets.length === 0) {
            container.innerHTML = '<div class="analysis-empty">Нет бюджетов за выбранный период.</div>';
            return;
        }

        const chartBudgets = budgets.slice(0, 6);
        const maxValue = Math.max(...chartBudgets.flatMap((item) => [item.target, item.actual]), 1);
        const width = 760;
        const height = 290;
        const chartHeight = 180;
        const baseY = 220;
        const groupWidth = 100;
        const gap = 24;
        const barWidth = 24;
        const startX = 54;
        const gridLines = [0, 0.25, 0.5, 0.75, 1];

        const grid = gridLines.map((ratio) => {
            const y = baseY - ratio * chartHeight;
            const label = this._formatCompactMoney(maxValue * ratio);
            return `
                <g>
                    <line x1="44" y1="${y}" x2="${width - 18}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
                    <text x="0" y="${y + 4}" fill="rgba(255,255,255,0.42)" font-size="12" font-family="Manrope, sans-serif">${label}</text>
                </g>
            `;
        }).join("");

        const groups = chartBudgets.map((item, index) => {
            const groupX = startX + index * (groupWidth + gap);
            const targetHeight = maxValue > 0 ? (item.target / maxValue) * chartHeight : 0;
            const actualHeight = maxValue > 0 ? (item.actual / maxValue) * chartHeight : 0;
            const title = this._escape(this._shortLabel(item.title, 10));
            const percent = `${Math.min(item.progress, 999).toFixed(0)}%`;
            return `
                <g>
                    <rect x="${groupX}" y="${baseY - targetHeight}" width="${barWidth}" height="${Math.max(targetHeight, 2)}" rx="12" fill="rgba(255,255,255,0.14)" />
                    <rect x="${groupX + 34}" y="${baseY - actualHeight}" width="${barWidth}" height="${Math.max(actualHeight, 2)}" rx="12" fill="#484FFF" />
                    <text x="${groupX + 12}" y="${baseY + 20}" text-anchor="middle" fill="rgba(255,255,255,0.78)" font-size="12" font-family="Manrope, sans-serif">лимит</text>
                    <text x="${groupX + 46}" y="${baseY + 20}" text-anchor="middle" fill="rgba(255,255,255,0.78)" font-size="12" font-family="Manrope, sans-serif">факт</text>
                    <text x="${groupX + 28}" y="${baseY + 42}" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="800" font-family="Manrope, sans-serif">${title}</text>
                    <text x="${groupX + 28}" y="${baseY - Math.max(targetHeight, actualHeight) - 10}" text-anchor="middle" fill="#8E92FF" font-size="12" font-weight="800" font-family="Manrope, sans-serif">${percent}</text>
                </g>
            `;
        }).join("");

        container.innerHTML = `
            <svg class="analysis__chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Столбчатый график лимитов и трат">
                ${grid}
                ${groups}
            </svg>
        `;
    }

    private _renderBudgetList(root: HTMLElement, budgets: AnalysisBudgetItem[]): void {
        const container = root.querySelector<HTMLElement>(".js--analysis-budget-list");
        if (!container) return;
        if (budgets.length === 0) {
            container.innerHTML = "";
            return;
        }

        container.innerHTML = budgets.map((item) => {
            const progress = Math.max(2, Math.min(item.progress, 100));
            const categories = item.categories.length > 0 ? item.categories.join(", ") : "Без категорий";
            return `
                <article class="analysis-budget-card">
                    <div class="analysis-budget-card__head">
                        <div>
                            <h4 class="analysis-budget-card__title">${this._escape(item.title)}</h4>
                            <p class="analysis-budget-card__categories">${this._escape(categories)}</p>
                        </div>
                        <span class="analysis-budget-card__percent">${item.progress.toFixed(0)}%</span>
                    </div>
                    <div class="analysis-budget-card__meta">
                        <span>Лимит ${this._formatMoney(item.target)}</span>
                        <span>Факт ${this._formatMoney(item.actual)}</span>
                    </div>
                    <div class="analysis-budget-card__progress">
                        <div class="analysis-budget-card__progress-fill" style="width:${progress}%"></div>
                    </div>
                </article>
            `;
        }).join("");
    }

    private _renderDonut(root: HTMLElement, categories: AnalysisCategoryItem[], totalExpenses: number): void {
        const donut = root.querySelector<HTMLElement>(".js--analysis-donut");
        const legend = root.querySelector<HTMLElement>(".js--analysis-donut-legend");
        if (!donut || !legend) return;
        donut.hidden = false;

        if (categories.length === 0 || totalExpenses <= 0) {
            donut.innerHTML = '<div class="analysis-empty">Нет расходов за выбранный период.</div>';
            donut.style.background = "transparent";
            legend.innerHTML = "";
            donut.hidden = true;
            return;
        }

        const visibleCategories = this._getVisibleDonutCategories(categories);
        let start = 0;
        const parts: string[] = [];
        visibleCategories.forEach((item, index) => {
            const end = start + item.share * 3.6;
            parts.push(`${DONUT_COLORS[index % DONUT_COLORS.length]} ${start}deg ${end}deg`);
            start = end;
        });
        if (start < 360) {
            parts.push(`rgba(255,255,255,0.08) ${start}deg 360deg`);
        }
        donut.style.background = `conic-gradient(${parts.join(", ")})`;
        donut.innerHTML = `
            <div class="analysis-donut__center">
                <span class="analysis-donut__center-label">Расходы</span>
                <span class="analysis-donut__center-value">${this._formatMoney(totalExpenses)}</span>
            </div>
        `;

        legend.innerHTML = visibleCategories.map((item, index) => `
            <div class="analysis-donut-legend__item">
                <span class="analysis-donut-legend__dot" style="background:${DONUT_COLORS[index % DONUT_COLORS.length]}"></span>
                <span class="analysis-donut-legend__name">${this._escape(item.category)}</span>
                <span class="analysis-donut-legend__value">${this._formatMoney(item.amount)} · ${item.share.toFixed(0)}%</span>
            </div>
        `).join("");
    }

    private _renderLineChart(root: HTMLElement, timeline: AnalysisTimelineItem[]): void {
        const container = root.querySelector<HTMLElement>(".js--analysis-line-chart");
        if (!container) return;

        if (timeline.length === 0) {
            container.innerHTML = '<div class="analysis-empty">Нет операций за выбранный период.</div>';
            return;
        }

        const width = 760;
        const height = 280;
        const padding = { top: 20, right: 24, bottom: 44, left: 40 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;
        const maxValue = Math.max(...timeline.flatMap((item) => [item.income, item.expense]), 1);

        const xStep = timeline.length > 1 ? plotWidth / (timeline.length - 1) : 0;
        const pointX = (index: number): number => padding.left + index * xStep;
        const pointY = (value: number): number => padding.top + plotHeight - (value / maxValue) * plotHeight;

        const incomePath = timeline.map((item, index) => `${index === 0 ? "M" : "L"}${pointX(index)},${pointY(item.income)}`).join(" ");
        const expensePath = timeline.map((item, index) => `${index === 0 ? "M" : "L"}${pointX(index)},${pointY(item.expense)}`).join(" ");

        const xLabels = timeline.map((item, index) => {
            const step = timeline.length > 12 ? Math.ceil(timeline.length / 6) : 1;
            if (index % step !== 0 && index !== timeline.length - 1) return "";
            return `<text x="${pointX(index)}" y="${height - 14}" text-anchor="middle" fill="rgba(255,255,255,0.42)" font-size="12" font-family="Manrope, sans-serif">${this._escape(item.label)}</text>`;
        }).join("");

        const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + plotHeight - ratio * plotHeight;
            const label = this._formatCompactMoney(maxValue * ratio);
            return `
                <g>
                    <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
                    <text x="0" y="${y + 4}" fill="rgba(255,255,255,0.42)" font-size="12" font-family="Manrope, sans-serif">${label}</text>
                </g>
            `;
        }).join("");

        container.innerHTML = `
            <svg class="analysis__chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="График доходов и расходов">
                ${grid}
                <path d="${incomePath}" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                <path d="${expensePath}" fill="none" stroke="#484FFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                ${timeline.map((item, index) => `
                    <circle cx="${pointX(index)}" cy="${pointY(item.income)}" r="3.5" fill="#ffffff" />
                    <circle cx="${pointX(index)}" cy="${pointY(item.expense)}" r="3.5" fill="#484FFF" />
                `).join("")}
                ${xLabels}
            </svg>
            <div class="analysis-line-legend">
                <span class="analysis-line-legend__item"><span class="analysis-line-legend__dot" style="background:#484FFF"></span>Расходы</span>
                <span class="analysis-line-legend__item"><span class="analysis-line-legend__dot" style="background:#ffffff"></span>Доходы</span>
            </div>
        `;
    }

    private _showError(root: HTMLElement, message: string): void {
        const errorBox = root.querySelector<HTMLElement>(".js--analysis-error");
        if (!errorBox) return;
        errorBox.hidden = false;
        errorBox.textContent = message;
    }

    private _emptyAnalysisResponse(): AnalysisResponse {
        return {
            code: 200,
            message: "Ok",
            period: this._selectedPeriod,
            period_label: "Период",
            period_start: "",
            period_end: "",
            summary: {
                total_budget_limit: 0,
                total_budget_spent: 0,
                total_budget_free: 0,
                income_total: 0,
                expense_total: 0,
                savings: 0,
            },
            budgets: [],
            categories: [],
            timeline: [],
        };
    }


    private _sortBudgetsByLimit(budgets: AnalysisBudgetItem[]): AnalysisBudgetItem[] {
        return [...budgets].sort((a, b) => {
            if (b.target === a.target) {
                return b.actual - a.actual;
            }
            return b.target - a.target;
        });
    }

    private _getVisibleDonutCategories(categories: AnalysisCategoryItem[]): AnalysisCategoryItem[] {
        const sortedCategories = [...categories].sort((a, b) => b.amount - a.amount);

        if (sortedCategories.length <= MAX_DONUT_ITEMS) {
            return sortedCategories;
        }

        const mainCategories = sortedCategories.slice(0, MAX_DONUT_ITEMS - 1);
        const otherCategories = sortedCategories.slice(MAX_DONUT_ITEMS - 1);
        const otherAmount = otherCategories.reduce((sum, item) => sum + item.amount, 0);
        const otherShare = otherCategories.reduce((sum, item) => sum + item.share, 0);

        return [
            ...mainCategories,
            {
                category: "Другое",
                amount: otherAmount,
                share: otherShare,
            },
        ];
    }

    private _formatMoney(value: number): string {
        return new Intl.NumberFormat("ru-RU", {
            maximumFractionDigits: 0,
        }).format(value) + " ₽";
    }

    private _formatCompactMoney(value: number): string {
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
        if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
        return `${Math.round(value)}`;
    }

    private _shortLabel(label: string, maxLength: number): string {
        return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
    }

    private _escape(text: string): string {
        return text
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }
}
