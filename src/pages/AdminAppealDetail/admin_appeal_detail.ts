import { BasePage } from "../base_page.ts";
import template from "./admin_appeal_detail.hbs?raw";
import Handlebars from "handlebars";
import { get_admin_appeal_by_id, update_appeal_status } from "../../api/admin.ts";
import "./admin_appeal_detail.scss";

const statusLabels: Record<string, { text: string; type: string }> = {
    OPEN:    { text: "Новое",    type: "new" },
    IN_WORK: { text: "В работе", type: "in_progress" },
    CLOSED:  { text: "Решено",   type: "resolved" },
};

export class AdminAppealDetailPage extends BasePage {
    private _appealId: string;

    constructor(params: Record<string, string>) {
        super();
        this._appealId = params.id;
    }

    async render(root: HTMLElement): Promise<void> {
        await super.render(root);

        root.innerHTML = `<div class="admin-appeal-detail__loading">Загрузка обращения #${this._appealId}...</div>`;

        try {
            const data = await get_admin_appeal_by_id(this._appealId);

            if (!data) {
                root.innerHTML = `<div class="admin-appeal-detail__error">Обращение не найдено</div>`;
                return;
            }

            const compiledTemplate = Handlebars.compile(template);
            const profile = data.user;
            data.avatar = profile?.avatar_url && profile.avatar_url !== "img/default.png"
                ? (profile.avatar_url.startsWith("http")
                    ? profile.avatar_url
                    : `${import.meta.env.VITE_SERVER_URL}/img/${profile.avatar_url}`)
                : "";
            root.innerHTML = compiledTemplate(data);

            // Кнопка назад
            const backBtn = root.querySelector<HTMLElement>(".js--admin-appeal-detail-back");
            backBtn?.addEventListener("click", () => window.history.back());

            // Select — установить текущий статус
            const select = root.querySelector<HTMLSelectElement>(".js--status-select");
            if (select && data.rawStatus) {
                select.value = data.rawStatus as string;
            }

            const saveBtn = root.querySelector<HTMLElement>(".js--save-status");
            const saveMsg = root.querySelector<HTMLElement>(".js--save-msg");
            const statusBadge = root.querySelector<HTMLElement>(".admin-appeal-detail__status");

            saveBtn?.addEventListener("click", async () => {
                if (!select) return;
                const newStatus = select.value as "OPEN" | "IN_WORK" | "CLOSED";
                try {
                    await update_appeal_status(Number(data.id), newStatus);

                    // Обновляем бейдж в DOM без перезагрузки
                    if (statusBadge) {
                        const { text, type } = statusLabels[newStatus];
                        statusBadge.textContent = text;
                        statusBadge.className = `admin-appeal-detail__status admin-appeal-detail__status--${type}`;
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
            root.innerHTML = `<div class="admin-appeal-detail__error">Ошибка сервера</div>`;
        }
    }
}