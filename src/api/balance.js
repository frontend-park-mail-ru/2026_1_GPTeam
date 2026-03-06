import {client} from "./client.js"

export const get_balance = async function () {
    let response = await client("/balance", {
        method: "GET",
        credentials: "include",
    })
    return await response.json();
}
