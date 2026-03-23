self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                return response;
            })
            .catch((error) => {
                console.warn("Server unavailable");
                return new Response(
                    JSON.stringify({
                        code: 503,
                        message: error.message,
                        error: "Network error",
                        offline: true,
                        url: event.request.url,
                    }),
                    {
                        status: 503,
                        statusText: "Server unavailable",
                        headers: { "Content-Type": "application/json" }
                    }
                );
            })
    );
});
