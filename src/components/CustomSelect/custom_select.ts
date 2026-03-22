/**
 * Кастомный селект для выбора значения из списка.
 * @class CustomSelect
 */
export class CustomSelect {
    private _display: HTMLElement;
    private _input: HTMLInputElement;
    private _dropdown: HTMLElement;
    private _onChange?: (value: string) => void;

    /**
     * @param {HTMLElement} display - Элемент отображения текущего значения.
     * @param {HTMLInputElement} input - Скрытый input.
     * @param {HTMLElement} dropdown - Контейнер выпадающего списка.
     * @param {(value: string) => void} [onChange] - Колбэк при выборе.
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
                this._input.value = value;
                this._display.textContent = value;
                this._dropdown.querySelectorAll(".custom-select__option").forEach(o => o.classList.remove("selected"));
                option.classList.add("selected");
                this._dropdown.classList.remove("open");
                this._onChange?.(value);
            });
        });

        const first = this._dropdown.querySelector<HTMLElement>(".custom-select__option");
        if (first) {
            first.classList.add("selected");
            this._input.value = first.dataset.value ?? "";
            this._display.textContent = first.dataset.value ?? "";
        }
    }

    /**
     * Закрывает дропдаун.
     */
    close(): void {
        this._dropdown.classList.remove("open");
    }

    /**
     * Возвращает текущее значение.
     * @returns {string}
     */
    getValue(): string {
        return this._input.value;
    }
}