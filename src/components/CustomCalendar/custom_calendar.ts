import { MONTHS, WEEKDAYS } from "../../store/store.js";

/**
 * Кастомный календарь с поддержкой ручного ввода, маски даты и синхронизации.
 * @class CustomCalendar
 */
export class CustomCalendar {
    private _viewYear: number;
    private _viewMonth: number;
    private _selected: Date | null = null;
    private _minDate: Date | null;
    private _maxDate: Date | null;
    private _popup: HTMLElement;
    private _display: HTMLInputElement;
    private _input: HTMLInputElement;
    private _onSelect?: (date: Date | null) => void;

    /**
     * @param {HTMLElement} popup - Контейнер выпадающего календаря.
     * @param {HTMLElement} display - Видимый инпут для отображения и ввода (ДД.ММ.ГГГГ).
     * @param {HTMLInputElement} input - Скрытый инпут для передачи на сервер (ГГГГ-ММ-ДД).
     * @param {Date | null} minDate - Минимально допустимая дата.
     * @param {Function} onSelect - Колбэк при изменении даты.
     */
    constructor(
        popup: HTMLElement,
        display: HTMLElement,
        input: HTMLInputElement,
        minDate: Date | null = null,
        onSelect?: (date: Date | null) => void,
    ) {
        const now = new Date();
        this._viewYear = now.getFullYear();
        this._viewMonth = now.getMonth();
        this._minDate = minDate;
        this._maxDate = null;
        this._popup = popup;
        this._display = display as HTMLInputElement;
        this._input = input;
        this._onSelect = onSelect;

        this._setupManualInput();
    }

    /**
     * Настраивает логику ручного ввода и маску ДД.ММ.ГГГГ.
     * @private
     */
    private _setupManualInput(): void {
        this._display.addEventListener("keypress", (e: KeyboardEvent) => {
            if (!/[\d.]/.test(e.key)) e.preventDefault();
        });

        this._display.addEventListener("input", () => {
            let value = this._display.value.replace(/[^\d]/g, "");
            
            if (value.length > 2) value = value.slice(0, 2) + "." + value.slice(2);
            if (value.length > 5) value = value.slice(0, 5) + "." + value.slice(5, 10);
            this._display.value = value;

            if (value.length < 10) {
                this._display.style.color = "";
                return;
            }

            const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
            if (match) {
                const d = parseInt(match[1], 10);
                const m = parseInt(match[2], 10);
                const y = parseInt(match[3], 10);

                const date = new Date(y, m - 1, d);
                const isValid = !isNaN(date.getTime()) && 
                                date.getFullYear() === y && 
                                date.getMonth() === m - 1 && 
                                date.getDate() === d;

                if (isValid && y <= 2100 && m <= 12) {
                    this._display.style.color = "";
                    this._selected = date;
                    this._viewYear = y;
                    this._viewMonth = m - 1;
                    this._input.value = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    this._display.classList.add("has-value");
                    this._onSelect?.(date);
                    if (this.isOpen()) this.render();
                } else {
                    this._display.style.color = "red";
                }
            }
        });
    }

    /**
     * Переключает отображаемый месяц и год.
     * @param {Date} date
     */
    setView(date: Date): void {
        this._viewYear = date.getFullYear();
        this._viewMonth = date.getMonth();
        if (this.isOpen()) this.render();
    }

    /**
     * Открывает или закрывает попап календаря.
     */
    toggle(): void {
        if (this._popup.classList.contains("open")) {
            this.close();
        } else {
            if (this._selected) {
                this._viewYear = this._selected.getFullYear();
                this._viewMonth = this._selected.getMonth();
            }
            this.render();
            this._popup.classList.add("open");
        }
    }

    /**
     * Закрывает календарь.
     */
    close(): void {
        this._popup.classList.remove("open");
    }

    /**
     * @returns {boolean} Состояние видимости календаря.
     */
    isOpen(): boolean {
        return this._popup.classList.contains("open");
    }

    /**
     * Устанавливает минимальную дату для выбора.
     * @param {Date | null} date
     */
    setMinDate(date: Date | null): void {
        this._minDate = date;
        if (this.isOpen()) this.render();
    }

    /**
     * @returns {Date | null} Текущая выбранная дата.
     */
    getValue(): Date | null {
        return this._selected;
    }

    /**
     * Сбрасывает выбранную дату и очищает инпуты.
     */
    clearSelection(): void {
        const now = new Date();
        this._selected = null;
        this._viewYear = now.getFullYear();
        this._viewMonth = now.getMonth();
        
        this._input.value = "";
        this._display.value = "";
        this._display.style.color = "";
        this._display.classList.remove("has-value");
        
        this._onSelect?.(null);
        if (this.isOpen()) this.render();
    }

    /**
     * Рендерит сетку календаря.
     */
    render(): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDay = new Date(this._viewYear, this._viewMonth, 1);
        const lastDay = new Date(this._viewYear, this._viewMonth + 1, 0);
        
        let startDow = firstDay.getDay();
        startDow = startDow === 0 ? 6 : startDow - 1;

        const weekdaysHtml = WEEKDAYS.map(d => `<div class="custom-calendar__weekday">${d}</div>`).join("");
        let daysHtml = "";

        for (let i = 0; i < startDow; i++) {
            daysHtml += `<div class="custom-calendar__day empty"></div>`;
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(this._viewYear, this._viewMonth, d);
            date.setHours(0, 0, 0, 0);
            
            const isToday = date.getTime() === today.getTime();
            const isSelected = this._selected && date.getTime() === this._selected.getTime();
            const isDisabled = this._minDate ? date < this._minDate : false;

            const dateStr = `${this._viewYear}-${String(this._viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            let cls = "custom-calendar__day";
            if (isDisabled) cls += " disabled";
            if (isToday) cls += " today";
            if (isSelected) cls += " selected";
            
            daysHtml += `<div class="${cls}" data-date="${dateStr}">${d}</div>`;
        }

        const filledSoFar = startDow + lastDay.getDate();
        for (let i = filledSoFar; i < 42; i++) {
            daysHtml += `<div class="custom-calendar__day empty"></div>`;
        }

        this._popup.innerHTML = `
            <div class="custom-calendar__header">
                <button type="button" class="custom-calendar__nav" id="cal_prev">‹</button>
                <span class="custom-calendar__month">${MONTHS[this._viewMonth]} ${this._viewYear}</span>
                <button type="button" class="custom-calendar__nav" id="cal_next">›</button>
            </div>
            <div class="custom-calendar__weekdays">${weekdaysHtml}</div>
            <div class="custom-calendar__days">${daysHtml}</div>
            ${this._selected ? `<div class="custom-calendar__clear" id="cal_clear">Очистить</div>` : ""}
        `;

        this._popup.querySelector("#cal_prev")?.addEventListener("click", (e) => {
            e.stopPropagation();
            this._viewMonth--;
            if (this._viewMonth < 0) { this._viewMonth = 11; this._viewYear--; }
            this.render();
        });

        this._popup.querySelector("#cal_next")?.addEventListener("click", (e) => {
            e.stopPropagation();
            this._viewMonth++;
            if (this._viewMonth > 11) { this._viewMonth = 0; this._viewYear++; }
            this.render();
        });

        this._popup.querySelectorAll<HTMLElement>(".custom-calendar__day:not(.disabled, .empty)").forEach(day => {
            day.addEventListener("click", (e) => {
                e.stopPropagation();
                const [y, m, d] = day.dataset.date!.split("-").map(Number);
                const selectedDate = new Date(y, m - 1, d);
                
                this._selected = selectedDate;
                this._input.value = day.dataset.date!;
                this._display.value = `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
                this._display.style.color = "";
                this._display.classList.add("has-value");
                
                this._onSelect?.(selectedDate);
                this.close();
            });
        });

        this._popup.querySelector("#cal_clear")?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.clearSelection();
            this.close();
        });
    }
}