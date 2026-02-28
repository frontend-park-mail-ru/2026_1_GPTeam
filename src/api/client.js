export const SERVER_URL = "http://localhost:8080"

export const client = (url, data) => fetch(SERVER_URL + url, data);
