import template from "./custom_checkbox.hbs?raw";
import "./custom_checkbox.scss";
import Handlebars from "handlebars";


/**
 * Класс для выбора нескольких значений.
 * @class CustomCheckBox
 */
export class CustomCheckBox {
    private _display: HTMLElement;
    private _dropdown: HTMLElement;
    private readonly _values: string[];
    private readonly _name: string;
    private readonly _labels: string[];
    private _selected_values: string[];

    constructor(display: HTMLElement, dropdown: HTMLElement, name: string, values: string[], labels: string[]) {
        this._display = display;
        this._dropdown = dropdown;
        this._values = values;
        this._name = name;
        this._labels = labels;
        this._selected_values = [];
        this._init();
    }

    private _init(): void {
        this._display.addEventListener("click", (e: PointerEvent) => {
            e.stopPropagation();
            this._dropdown.classList.toggle("open");
        });

        this.fill_data();

        this._dropdown.querySelectorAll<HTMLElement>(".custom-checkbox__item").forEach((elem: HTMLElement) => {
            let input: HTMLInputElement = elem.querySelector(".custom-checkbox__input") as HTMLInputElement;
            elem.addEventListener("click", (e: PointerEvent) => {
                e.stopPropagation();
                if (e.target !== input)
                    input.checked = !input.checked;
                if (input.checked) {
                    this._selected_values.push(input.value);
                }
                else {
                    this._selected_values = this._selected_values.filter((value: string): boolean => value !== input.value);
                }
                this._display.innerText = this._selected_values.join(", ");
            });
        });
    }

    private fill_data(): void {
        for (let i: number = 0; i < this._values.length; i++) {
            let compiledTemplate: HandlebarsTemplateDelegate = Handlebars.compile(template);
            const html: string = compiledTemplate({
                name: this._name,
                value: this._values[i],
                label: this._labels[i],
            });
            this._dropdown.insertAdjacentHTML("beforeend", html);
        }
    }

    close(): void {
        this._dropdown.classList.remove("open");
    }
}
