import { client } from "./client.js"

export const signup = async function (username, password, confirm_password, email) {
    const response = await client("/signup",  {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, confirm_password, email }),
    })
    return await response.json();
}