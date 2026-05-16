import {
    getMembers,
    removeMember,
    inviteUser,
    type Member,
    type UserSearchResult,
} from "../../api/invites";
import { UserSearchInput } from "../UserSearchInput";
import { showDangerConfirmModal, showMessageModal } from "../../utils/modal_helpers";

export class MembersList {
    private element: HTMLElement;
    private accountId: number;
    private isOwner: boolean;
    private members: Member[] = [];

    constructor(parent: HTMLElement, accountId: number, isOwner = false) {
        this.accountId = accountId;
        this.isOwner = isOwner;
        this.element = document.createElement("div");
        this.element.classList.add("invites-ui");
        parent.appendChild(this.element);
        this.render();
        void this.loadMembers();
    }

    private render(): void {
        this.element.innerHTML = `
            <div class="members-list">
                <div class="members-list-header">
                    <h3>Участники</h3>
                    ${this.isOwner ? '<button type="button" class="btn-add-member">+ Пригласить</button>' : ""}
                </div>
                <div class="members-list-content"></div>
                <div class="invite-modal hidden">
                    <div class="invite-modal-content">
                        <div class="invite-modal-header">
                            <h3>Пригласить участника</h3>
                            <button type="button" class="btn-close-modal" aria-label="Закрыть">×</button>
                        </div>
                        <div class="invite-modal-body">
                            <div class="user-search-wrapper"></div>
                            <p class="invite-hint">
                                Укажите email (точное совпадение) или начало username — поиск выполняется на сервере.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEvents();
    }

    private attachEvents(): void {
        const addBtn = this.element.querySelector(".btn-add-member");
        const closeBtn = this.element.querySelector(".btn-close-modal");
        const modal = this.element.querySelector(".invite-modal");

        addBtn?.addEventListener("click", () => {
            modal?.classList.remove("hidden");
            const searchWrapper = this.element.querySelector<HTMLElement>(".user-search-wrapper");
            if (searchWrapper) {
                searchWrapper.innerHTML = "";
                new UserSearchInput(searchWrapper, this.accountId, (user) => {
                    void this.handleInvite(user);
                });
            }
        });

        closeBtn?.addEventListener("click", () => {
            modal?.classList.add("hidden");
        });

        modal?.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.add("hidden");
        });
    }

    private async loadMembers(): Promise<void> {
        try {
            const response = await getMembers(this.accountId);
            if (response.code === 200 && response.members) {
                const serverMembers = response.members;

                // Сохраняем локальные pending-записи только для юзеров, которых
                // нет на сервере И которые ещё есть в this.members.
                // После удаления/отзыва мы предварительно чистим this.members,
                // поэтому удалённый юзер сюда не попадёт.
                const localPending = this.members.filter(
                    (m) =>
                        m.status === "pending" &&
                        !serverMembers.some((sm) => sm.user_id === m.user_id),
                );

                this.members = [...localPending, ...serverMembers];
                this.renderMembers();
            }
        } catch (error) {
            console.error("Failed to load members:", error);
        }
    }

    private renderMembers(): void {
        const content = this.element.querySelector(".members-list-content");
        if (!content) return;

        if (this.members.length === 0) {
            content.innerHTML = `
                <div class="members-empty">
                    <p>Пока нет участников для этого счёта.</p>
                </div>
            `;
            return;
        }

        content.innerHTML = this.members
            .map(
                (member) => `
                <div class="member-item ${member.status === "pending" ? "member-pending" : ""}">
                    <div class="member-avatar">
                        ${(member.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div class="member-info">
                        <div class="member-name">
                            ${this.escapeHtml(member.username)}
                            ${member.is_owner ? '<span class="member-badge member-badge--owner">Владелец</span>' : ""}
                            ${member.status === "pending" ? '<span class="member-badge member-badge--pending">Ожидает</span>' : ""}
                        </div>
                        <div class="member-email">${this.escapeHtml(member.email)}</div>
                    </div>
                    ${
                        this.isOwner && !member.is_owner
                            ? `<button type="button" class="btn-remove-member"
                                   data-user-id="${member.user_id}"
                                   data-status="${member.status}">
                                   ${member.status === "pending" ? "Отменить" : "Удалить"}
                               </button>`
                            : ""
                    }
                </div>
            `,
            )
            .join("");

        content.querySelectorAll<HTMLButtonElement>(".btn-remove-member").forEach((btn) => {
            btn.addEventListener("click", () => {
                const userId = parseInt(btn.dataset.userId || "0", 10);
                const status = btn.dataset.status ?? "accepted";
                this.handleRemoveClick(userId, status);
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

    private async handleInvite(user: UserSearchResult): Promise<void> {
        try {
            const query = (user.username || "").trim();
            const response = await inviteUser(this.accountId, query);

            if (response.code === 200) {
                const invite = (response as any).invite;
                if (invite) {
                    const synthetic: Member = {
                        id: invite.id ?? Date.now(),
                        account_id: this.accountId,
                        user_id: invite.user_id ?? 0,
                        username: query || "—",
                        email: "",
                        status: invite.status ?? "pending",
                        created_at: new Date().toISOString(),
                        is_owner: false,
                    };

                    if (!this.members.some((m) => m.user_id === synthetic.user_id && m.status === synthetic.status)) {
                        this.members.unshift(synthetic);
                        this.renderMembers();
                    }
                }

                this.element.querySelector(".invite-modal")?.classList.add("hidden");

                try {
                    const invitedUserId = (response as any).invite?.user_id;
                    if (typeof invitedUserId === "number") {
                        localStorage.setItem(`account:${this.accountId}:member_added:${invitedUserId}`, String(Date.now()));
                    } else {
                        localStorage.setItem(`account:${this.accountId}:members_changed`, String(Date.now()));
                    }
                } catch {
                    // ignore
                }

                await this.loadMembers();
            } else {
                showMessageModal("Приглашение", response.message || "Не удалось отправить приглашение");
            }
        } catch {
            showMessageModal("Ошибка", "Не удалось отправить приглашение");
        }
    }

    private handleRemoveClick(userId: number, status: string): void {
        const isPending = status === "pending";

        showDangerConfirmModal(
            isPending ? "Отменить приглашение?" : "Удалить участника?",
            isPending
                ? "Приглашение будет отозвано. Пользователь не получит доступ к счёту."
                : "Пользователь потеряет доступ к этому счёту.",
            async (modal) => {
                try {
                    const response = await removeMember(this.accountId, userId);
                    if (response.code === 200) {
                        modal.destroy();

                        // Убираем юзера из локального состояния ДО вызова loadMembers,
                        // чтобы localPending-логика не вернула его обратно в список.
                        this.members = this.members.filter((m) => m.user_id !== userId);

                        try {
                            localStorage.setItem(
                                `account:${this.accountId}:member_removed:${userId}`,
                                String(Date.now()),
                            );
                        } catch {
                            // ignore
                        }

                        await this.loadMembers();
                    } else {
                        modal.show_error(
                            response.message ||
                                (isPending ? "Не удалось отменить приглашение" : "Не удалось удалить участника"),
                        );
                    }
                } catch {
                    modal.show_error("Ошибка сети или сервера");
                }
            },
        );
    }

    public refresh(): void {
        void this.loadMembers();
    }

    public externalMemberRemoved(userId: number): void {
        const before = this.members.length;
        this.members = this.members.filter((m) => m.user_id !== userId);
        if (this.members.length !== before) this.renderMembers();
    }

    public externalMemberAdded(member: Member): void {
        if (!this.members.some((m) => m.user_id === member.user_id && m.status === member.status)) {
            this.members.unshift(member);
            this.renderMembers();
        }
    }

    public destroy(): void {
        this.element.remove();
    }
}