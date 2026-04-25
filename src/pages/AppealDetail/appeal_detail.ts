import { BasePage } from "../base_page.ts";
import template from "./appeal_detail.hbs?raw";
import Handlebars from "handlebars";
import { get_appeal_by_id } from "../../api/appeal.ts";
import { check_is_staff, update_appeal_status } from "../../api/admin.ts";
import "./appeal_detail.scss";

const statusLabels: Record<string, { text: string; type: string }> = {
    OPEN:    { text: "Новое",    type: "new" },
    IN_WORK: { text: "В работе", type: "in_progress" },
    CLOSED:  { text: "Решено",   type: "resolved" },
};

export class AppealDetailPage extends BasePage {
    private _appealId: string;

    constructor(params: Record<string, string>) {
        super();
        this._appealId = params.id;
    }

    async render(root: HTMLElement): Promise<void> {
        await super.render(root);

        root.innerHTML = `<div class="appeal-detail__loading">Загрузка обращения #${this._appealId}...</div>`;

        try {
            const [data, staffResponse] = await Promise.all([
                get_appeal_by_id(this._appealId),
                check_is_staff(),
            ]);

            if (!data) {
                root.innerHTML = `<div class="appeal-detail__error">Обращение не найдено</div>`;
                return;
            }

            const isStaff = staffResponse?.is_staff === true;

            const compiledTemplate = Handlebars.compile(template);
            root.innerHTML = compiledTemplate({ ...data, isStaff });

            // Кнопка назад
            root.querySelector<HTMLElement>(".js--appeal-detail-back")
                ?.addEventListener("click", () => window.history.back());

            if (!isStaff) return; // обычный пользователь — дальше не идём

            // Установить текущий статус в select
            const select = root.querySelector<HTMLSelectElement>(".js--status-select");
            if (select && data.rawStatus) {
                select.value = data.rawStatus as string;
            }

            const saveBtn = root.querySelector<HTMLElement>(".js--save-status");
            const saveMsg = root.querySelector<HTMLElement>(".js--save-msg");
            const statusBadge = root.querySelector<HTMLElement>(".appeal-detail__status");

            saveBtn?.addEventListener("click", async () => {
                if (!select) return;
                const newStatus = select.value as "OPEN" | "IN_WORK" | "CLOSED";
                try {
                    await update_appeal_status(Number(data.id), newStatus);

                    if (statusBadge) {
                        const { text, type } = statusLabels[newStatus];
                        statusBadge.textContent = text;
                        statusBadge.className = `appeal-detail__status appeal-detail__status--${type}`;
                    }

                    if (saveMsg) {
                        saveMsg.textContent = "Статус обновлён";
                        saveMsg.style.color = "#4caf50";
                        setTimeout(() => { saveMsg.textContent = ""; }, 3000);
                    }
                } catch {
                    if (saveMsg) {
                        saveMsg.textContent = "Ошибка при обновлении";
                        saveMsg.style.color = "#ff4848";
                    }
                }
            });

        } catch (error) {
            console.error("Ошибка при загрузке обращения:", error);
            root.innerHTML = `<div class="appeal-detail__error">Ошибка сервера</div>`;
        }
    }
}