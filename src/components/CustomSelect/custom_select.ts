/**
 * Кастомный селект для выбора значения из списка.
 * @class CustomSelect
 */
export class CustomSelect {
    private _display: HTMLElement;
    private _input: HTMLInputElement;
    private _dropdown: HTMLElement;
    private _onChange?: (value: string) => void;
    private _initialValue: string = "";
    private _initialLabel: string = "";

    /**
     * @param {HTMLElement} display
     * @param {HTMLInputElement} input
     * @param {HTMLElement} dropdown
     * @param {(value: string) => void} [onChange]
     */
    constructor(
        display: HTMLElement,
        input: HTMLInputElement,
        dropdown: HTMLElement,
        onChange?: (value: string) => void,
    ) {
        this._display = display;
        this._input = input;
        this._dropdown = dropdown;
        this._onChange = onChange;
        this._init();
    }

    private _init(): void {
        this._display.addEventListener("click", (e) => {
            e.stopPropagation();
            this._dropdown.classList.toggle("open");
        });

        this._dropdown.querySelectorAll<HTMLElement>(".custom-select__option").forEach(option => {
            option.addEventListener("click", (e) => {
                e.stopPropagation();
                const value = option.dataset.value ?? "";
                const label = option.textContent?.trim() ?? value;
                this._input.value = value;
                this._display.textContent = label;
                this._dropdown.querySelectorAll(".custom-select__option").forEach(o => o.classList.remove("selected"));
                option.classList.add("selected");
                this._dropdown.classList.remove("open");
                this._onChange?.(value);
            });
        });

        const first = this._dropdown.querySelector<HTMLElement>(".custom-select__option");
        if (first) {
            first.classList.add("selected");
            this._initialValue = first.dataset.value ?? "";
            this._initialLabel = first.textContent?.trim() ?? (first.dataset.value ?? "");
            this._input.value = this._initialValue;
            this._display.textContent = this._initialLabel;
        }
    }

    /** Закрывает дропдаун. */
    close(): void {
        this._dropdown.classList.remove("open");
    }

    /** Сбрасывает выбор на начальное значение. */
    reset(): void {
        this._input.value = this._initialValue;
        this._display.textContent = this._initialLabel;
        this._dropdown.querySelectorAll(".custom-select__option").forEach(o => o.classList.remove("selected"));
        const first = this._dropdown.querySelector<HTMLElement>(".custom-select__option");
        if (first) {
            first.classList.add("selected");
        }
        this._onChange?.(this._initialValue);
    }

    /** @returns {string} */
    getValue(): string {
        return this._input.value;
    }
}
