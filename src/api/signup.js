import { client } from "./client.js"

export const signup = async function (username, password, email) {
    const response = await client("/signup",  {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, email }),
    })
    return await response.json();
}