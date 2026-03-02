export const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const client = (url, data) => fetch(SERVER_URL + url, data)
