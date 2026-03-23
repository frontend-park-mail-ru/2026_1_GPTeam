export const MONTHS: string[] = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export const WEEKDAYS: string[] = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

let currencies: string[] = [];
let categories: string[] = [];
let transactionTypes: string[] = [];

/** @returns {string[]} */
export function get_currencies(): string[] { return currencies; }

/** @param {string[]} v */
export function set_currencies(v: string[]): void { currencies = v; }

/** @returns {string[]} */
export function get_categories(): string[] { return categories; }

/** @param {string[]} v */
export function set_categories(v: string[]): void { categories = v; }

/** @returns {string[]} */
export function get_transaction_types(): string[] { return transactionTypes; }

/** @param {string[]} v */
export function set_transaction_types(v: string[]): void { transactionTypes = v; }