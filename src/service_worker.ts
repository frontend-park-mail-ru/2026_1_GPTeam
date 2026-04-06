/// <reference lib="webworker" />

import {precacheAndRoute} from "workbox-precaching"
import {CacheFirst, NetworkFirst} from "workbox-strategies"
import {registerRoute, setDefaultHandler} from "workbox-routing"
import {ExpirationPlugin} from "workbox-expiration"


precacheAndRoute(self.__WB_MANIFEST)

declare const self: ServiceWorkerGlobalScope


const CacheHeaderPlugin = {
    cacheWillUpdate: async ({request, response}: {request: Request, response: Response}) => {
        if (!response) return null;
        let cached_response = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers)
        });
        cached_response.headers.set("X-Cached", "true");
        return cached_response;
    }
};

self.addEventListener("install", (event: ExtendableEvent) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event: ExtendableEvent) => {
    event.waitUntil(self.clients.claim());
});

registerRoute(
    ({request}) => {
        return request.destination === "script" ||
            request.destination === "style" ||
            request.destination === "font" ||
            request.destination === "image" ||
            request.destination === "document";
    },
    new CacheFirst({
        cacheName: "static",
        plugins: [
            CacheHeaderPlugin,
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60,
            })
        ]
    })
);

setDefaultHandler(
    new NetworkFirst({
        cacheName: "default",
        networkTimeoutSeconds: 5,
        plugins: [
            CacheHeaderPlugin,
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 60 * 60,
            })
        ]
    })
);
