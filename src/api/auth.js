import { client } from "./client.js"

export const is_login = async function () {
    let response = await client("/auth/refresh", {
        method: "POST",
        credentials: "include",
    });
    let data = await response.json();
    return data.code === 200;
}

export const logout = async function () {
    let response = await client("/auth/logout", {
        method: "POST",
        credentials: "include",
    });
    let data = await response.json();
    return data.code === 200;
}
