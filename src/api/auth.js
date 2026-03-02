import { client } from "./client.js"

export const is_login = async function (url) {
    let response = await client(url, {
        method: "GET",
        credentials: "include",
    })
    let data = await response.json();
    if (data["is_auth"] === false) {
        response = await client("/auth/refresh", {
            method: "GET",
            credentials: "include",
        })
        data = await response.json();
    }
    return data;
}
