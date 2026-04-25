import {client} from "../api/client.ts";

export const MONTHS: string[] = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export const WEEKDAYS: string[] = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

// Используем any[], так как с бэка прилетают объекты {id: 1, name: "USD"} и т.д.
let currencies: any[] = [];
let categories: any[] = [];
let transactionTypes: any[] = [];

/** @returns {any[]} */
export function get_currencies(): any[] { return currencies; }

/** @param {any[]} v */
export function set_currencies(v: any[]): void { currencies = v; }

/** @returns {any[]} */
export function get_categories(): any[] { return categories; }

/** @param {any[]} v */
export function set_categories(v: any[]): void { categories = v; }

/** @returns {any[]} */
export function get_transaction_types(): any[] { return transactionTypes; }

/** @param {any[]} v */
export function set_transaction_types(v: any[]): void { transactionTypes = v; }

let id: number = -1;

export async function get_user_id(): Promise<number> {
    if (id == -1) {
        let response: Response = await client("/auth/refresh", {
            method: "POST",
            credentials: "include",
        });
        let data: any = await response.json();
        id = data.user.id;
    }
    return id;
}
