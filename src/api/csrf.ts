export const CSRF_COOKIE_NAME: string = "csrf_token";


export function get_token(): string | null {
    const cookies: string[] = document.cookie.split(";");
    const csrf_cookie: string | undefined = cookies.find((cookie: string) =>
        cookie.trim().startsWith(CSRF_COOKIE_NAME + "=")
    );
    if (csrf_cookie) {
        return csrf_cookie.split("=")[1];
    }
    return null;
}
