let url_params = new URLSearchParams(window.location.search);
let SERVER_URL = url_params.get("server_url");

function getCookie(name) {
    return document.cookie
        .split("; ")
        .find(row => row.startsWith(name + "="))
        ?.split("=")[1] || "";
}

document.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const category = document.getElementById("category_input").value;
    const message = document.getElementById("description_input").value;

    const csrf = getCookie("csrf_token");

    const payload = {
        category,
        message,
    };
    const body = JSON.stringify(payload);

    try {
        if (window.parent !== window) {
            window.parent.postMessage(
                {
                    source: "support-form.html",
                    kind: "appeal-submit-json",
                    body,
                },
                window.location.origin,
            );
        }
    } catch (_) {
        /* cross-origin parent — не шлём */
    }

    try {
        const res = await fetch(SERVER_URL + "/support/create_appeal", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrf
            },
            body,
        });
        console.log(res)
        if (!res.ok) {
            document.getElementById("error_message").textContent =
                "Ошибка отправки (" + res.status + ")";
            return;
        }

        document.getElementById("error_message").textContent = "";

    } catch (err) {
        document.getElementById("error_message").textContent =
            err;
    }
});
