import {client} from "./client.js";
import {is_login} from "./auth.js";


export const get_profile = async function () {
    let response = await client("/profile", {
        method: "GET",
        credentials: "include",
    })
    let data = await response.json();
    if (data.code === 401) {
        let login = await is_login();
        if (login) {
            response = await client("/profile", {
                method: "GET",
                credentials: "include",
            })
            return await response.json();
        }
    }
    return data;
}
