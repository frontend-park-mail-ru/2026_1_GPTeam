import { searchUsers, type UserSearchResult } from "../../api/invites";

export class UserSearchInput {
    private element: HTMLElement;
    private input!: HTMLInputElement;
    private dropdown!: HTMLElement;
    private searchTimeout: number | null = null;
    private results: UserSearchResult[] = [];
    private onSelect: (user: UserSearchResult) => void;
    private accountId: number;

    constructor(
        parent: HTMLElement,
        accountId: number,
        onSelect: (user: UserSearchResult) => void,
        placeholder: string = "Введите email или username"
    ) {
        this.accountId = accountId;
        this.onSelect = onSelect;
        this.element = document.createElement("div");
        parent.appendChild(this.element);
        this.render(placeholder);
        this.attachEvents();
    }

    private render(placeholder: string): void {
        this.element.innerHTML = `
            <div class="user-search-container">
                <input
                    type="text"
                    class="user-search-input"
                    placeholder="${placeholder}"
                    autocomplete="off"
                />
                <div class="user-search-dropdown hidden"></div>
            </div>
        `;

        this.input = this.element.querySelector(".user-search-input") as HTMLInputElement;
        this.dropdown = this.element.querySelector(".user-search-dropdown") as HTMLElement;
    }

    private attachEvents(): void {
        this.input.addEventListener("input", (e) => {
            const query = (e.target as HTMLInputElement).value.trim();

            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            if (query === "") {
                this.hideDropdown();
                return;
            }

            this.searchTimeout = window.setTimeout(() => {
                void this.performSearch(query);
            }, 400);
        });

        this.input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const query = this.input.value.trim();
                if (query) void this.performSearch(query, true);
            } else if (e.key === "Escape") {
                this.hideDropdown();
            } else if (e.key === "ArrowDown" && !this.dropdown.classList.contains("hidden")) {
                e.preventDefault();
                this.focusNextResult();
            } else if (e.key === "ArrowUp" && !this.dropdown.classList.contains("hidden")) {
                e.preventDefault();
                this.focusPreviousResult();
            }
        });

        this.input.addEventListener("blur", () => {
            setTimeout(() => this.hideDropdown(), 250);
        });

        document.addEventListener("click", (e) => {
            if (!this.element.contains(e.target as Node)) {
                this.hideDropdown();
            }
        });
    }

    private async performSearch(query: string, exactMatch = false): Promise<void> {
        try {
            const response = await searchUsers(this.accountId, query);

            if (response.code === 200 && response.users && response.users.length > 0) {
                this.results = response.users;

                if (exactMatch && response.users.length === 1) {
                    this.onSelect(response.users[0]);
                    this.input.value = "";
                    this.hideDropdown();
                } else {
                    this.showDropdown();
                }
            } else {
                this.results = [];
                this.hideDropdown();
            }
        } catch (error) {
            console.error("Search failed:", error);
            this.results = [];
            this.hideDropdown();
        }
    }

    private showDropdown(): void {
        this.dropdown.innerHTML = this.results
            .map(
                (user) => `
                <div class="user-search-result" data-user-id="${user.id}">
                    <div class="user-search-result-avatar">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>
                    <div class="user-search-result-info">
                        <div class="user-search-result-name">${user.username}</div>
                    </div>
                </div>
            `
            )
            .join("");

        this.dropdown.classList.remove("hidden");

        this.dropdown.querySelectorAll(".user-search-result").forEach((result) => {
            result.addEventListener("click", () => {
                const userId = parseInt(result.getAttribute("data-user-id") || "0");
                const user = this.results.find((u) => u.id === userId);
                if (user) {
                    this.onSelect(user);
                    this.input.value = "";
                    this.hideDropdown();
                }
            });
        });
    }

    private hideDropdown(): void {
        this.dropdown.classList.add("hidden");
        this.dropdown.innerHTML = "";
    }

    private focusNextResult(): void {
        const focused = this.dropdown.querySelector<HTMLElement>(".user-search-result.focused");
        if (focused) {
            focused.classList.remove("focused");
            const next = focused.nextElementSibling as HTMLElement | null;
            if (next) {
                next.classList.add("focused");
                next.scrollIntoView({ block: "nearest" });
            }
        } else {
            const first = this.dropdown.querySelector<HTMLElement>(".user-search-result");
            first?.classList.add("focused");
        }
    }

    private focusPreviousResult(): void {
        const focused = this.dropdown.querySelector<HTMLElement>(".user-search-result.focused");
        if (focused) {
            focused.classList.remove("focused");
            const prev = focused.previousElementSibling as HTMLElement | null;
            if (prev) {
                prev.classList.add("focused");
                prev.scrollIntoView({ block: "nearest" });
            }
        } else {
            const all = this.dropdown.querySelectorAll<HTMLElement>(".user-search-result");
            all[all.length - 1]?.classList.add("focused");
        }
    }

    public getValue(): string { return this.input.value; }
    public setValue(value: string): void { this.input.value = value; }
    public clear(): void { this.input.value = ""; this.hideDropdown(); }
    public focus(): void { this.input.focus(); }
    public destroy(): void { this.element.remove(); }
}