import { client } from "./client.js"

export const is_login = async function () {
    let response = await client("/is_login", {
        method: "POST",
        credentials: "include",
    })
    let data = await response.json();
    if (data["code"] === 401) {
        response = await client("/auth/refresh", {
            method: "POST",
            credentials: "include",
        })
        data = await response.json();
    }
    return data;
}
