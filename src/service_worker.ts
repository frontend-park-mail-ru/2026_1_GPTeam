/// <reference lib="webworker" />

import {precacheAndRoute} from "workbox-precaching"


precacheAndRoute(self.__WB_MANIFEST)

declare const self: ServiceWorkerGlobalScope

self.addEventListener("install", (event: ExtendableEvent) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event: ExtendableEvent) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event: FetchEvent) => {
    event.respondWith(
        fetch(event.request)
            .then((response: Response) => {
                return response;
            })
            .catch((error: any) => {
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
                        headers: {"Content-Type": "application/json"}
                    }
                );
            })
    );
});