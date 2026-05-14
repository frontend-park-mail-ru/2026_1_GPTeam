import {
    getPendingInvites,
    acceptInvite,
    rejectInvite,
    type PendingInvite,
} from "../../api/invites";
import { showDangerConfirmModal, showMessageModal } from "../../utils/modal_helpers";

export class PendingInvites {
    private element: HTMLElement;
    private invites: PendingInvite[] = [];

    constructor(parent: HTMLElement) {
        this.element = parent;
        this.element.hidden = true;
        this.element.classList.add("invites-ui");
        void this.loadInvites();
    }

    private async loadInvites(): Promise<void> {
        try {
            const response = await getPendingInvites();

            if (response.code !== 200 || !response.invites || response.invites.length === 0) {
                this.invites = [];
                this.element.innerHTML = "";
                this.element.hidden = true;
                return;
            }

            this.invites = response.invites;
            this.element.hidden = false;
            this.renderPanel();
            this.renderInvites();
        } catch (error) {
            console.error("Failed to load pending invites:", error);
            this.element.innerHTML = "";
            this.element.hidden = true;
        }
    }

    private renderPanel(): void {
        this.element.innerHTML = `
            <section class="pending-invites-panel" aria-labelledby="pending-invites-heading">
                <div class="pending-invites-panel__head">
                    <h3 id="pending-invites-heading">Приглашения в совместные счета</h3>
                </div>
                <div class="pending-invites-content"></div>
            </section>
        `;
    }

    private renderInvites(): void {
        const content = this.element.querySelector(".pending-invites-content");
        if (!content) return;

        content.innerHTML = this.invites
            .map((invite) => {
                const name = invite.account_name?.trim() || `Счёт №${invite.account_id}`;
                const date = new Date(invite.created_at).toLocaleString("ru-RU", {
                    dateStyle: "medium",
                    timeStyle: "short",
                });
                return `
                <div class="pending-invite-item">
                    <div class="pending-invite-info">
                        <div class="pending-invite-account">${this.escapeHtml(name)}</div>
                        <div class="pending-invite-meta">Приглашение · ${date}</div>
                    </div>
                    <div class="pending-invite-actions">
                        <button type="button" class="btn-accept-invite" data-account-id="${invite.account_id}">
                            Принять
                        </button>
                        <button type="button" class="btn-reject-invite" data-account-id="${invite.account_id}">
                            Отклонить
                        </button>
                    </div>
                </div>
            `;
            })
            .join("");

        content.querySelectorAll<HTMLButtonElement>(".btn-accept-invite").forEach((btn) => {
            btn.addEventListener("click", async () => {
                const accountId = parseInt(btn.dataset.accountId || "0", 10);
                await this.handleAccept(accountId);
            });
        });

        content.querySelectorAll<HTMLButtonElement>(".btn-reject-invite").forEach((btn) => {
            btn.addEventListener("click", () => {
                const accountId = parseInt(btn.dataset.accountId || "0", 10);
                this.handleRejectClick(accountId);
            });
        });
    }

    private escapeHtml(s: string): string {
        const map: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };
        return s.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
    }

    private async handleAccept(accountId: number): Promise<void> {
        try {
            const response = await acceptInvite(accountId);

            if (response.code === 200) {
                this.element.dispatchEvent(
                    new CustomEvent("invite-accepted", { bubbles: true, detail: { accountId } })
                );
                // Уведомляем другие вкладки/окна о том, что приглашение принято (если сервер вернул user_id)
                try {
                    const invitedUserId = (response as any).invite?.user_id;
                    if (typeof invitedUserId === "number") {
                        localStorage.setItem(`account:${accountId}:member_added:${invitedUserId}`, String(Date.now()));
                    } else {
                        localStorage.setItem(`account:${accountId}:members_changed`, String(Date.now()));
                    }
                } catch (e) {
                    // ignore
                }

                await this.loadInvites();
            } else {
                showMessageModal("Не удалось принять", response.message || "Попробуйте позже");
            }
        } catch {
            showMessageModal("Ошибка", "Не удалось принять приглашение. Проверьте соединение.");
        }
    }

    private handleRejectClick(accountId: number): void {
        showDangerConfirmModal(
            "Отклонить приглашение?",
            "Вы откажетесь от доступа к этому счёту. Повторное приглашение — только от владельца.",
            async (modal) => {
                try {
                    const response = await rejectInvite(accountId);
                    if (response.code === 200) {
                        modal.destroy();
                        this.element.dispatchEvent(
                            new CustomEvent("invite-rejected", { bubbles: true, detail: { accountId } })
                        );
                        await this.loadInvites();
                    } else {
                        modal.show_error(response.message || "Не удалось отклонить приглашение");
                    }
                } catch {
                    modal.show_error("Ошибка сети или сервера");
                }
            }
        );
    }

    public refresh(): void {
        void this.loadInvites();
    }

    public destroy(): void {
        this.element.innerHTML = "";
        this.element.hidden = true;
    }
}