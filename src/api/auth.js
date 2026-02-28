import { client } from "./client.js"
export const login = client("/login", "POST", {})