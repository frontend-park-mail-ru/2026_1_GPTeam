let url_params = new URLSearchParams(window.location.search);
let SERVER_URL = url_params.get("server_url");

function getCookie(name) {
    var cookies = document.cookie.split("; ");
    for (var i = 0; i < cookies.length; i++) {
        if (cookies[i].startsWith(name + "=")) {
            return cookies[i].split("=")[1] || "";
        }
    }
    return "";
}

function postMessageToParent(kind, data) {
    try {
        if (window.parent !== window) {
            window.parent.postMessage(
                {
                    source: "support-form.html",
                    kind: kind,
                },
                window.location.origin,
            );
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    window.parent.postMessage(
                        {
                            source: "support-form.html",
                            kind: kind,
                        },
                        window.location.origin,
                    );
                }
            }
        }
    } catch (_) {
    }
}

document.querySelector("form").addEventListener("submit", async function(e) {
    e.preventDefault();
    var category = document.getElementById("category_input").value;
    var message = document.getElementById("description_input").value;

    var csrf = getCookie("csrf_token");

    var payload = {
        category: category,
        message: message,
    };
    var body = JSON.stringify(payload);

    postMessageToParent("appeal-submit-start", { body: body });

    try {
        var res = await fetch(SERVER_URL + "/support/create_appeal", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrf
            },
            body: body,
        });

        if (!res.ok) {
            var errorText = await res.text();
            postMessageToParent("appeal-submit-error", {
                status: res.status,
                error: errorText || "Ошибка отправки",
            });
            document.getElementById("error_message").textContent =
                "Ошибка отправки (" + res.status + ")";
            return;
        }

        postMessageToParent("appeal-submit-success", {});
        document.getElementById("error_message").textContent = "";
        document.querySelector("form").reset();

    } catch (err) {
        var errorMessage = err instanceof Error ? err.message : String(err);
        postMessageToParent("appeal-submit-error", {
            error: errorMessage,
        });
        document.getElementById("error_message").textContent = errorMessage;
    }
});
