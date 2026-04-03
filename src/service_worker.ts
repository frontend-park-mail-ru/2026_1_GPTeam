/// <reference lib="webworker" />

import {precacheAndRoute} from "workbox-precaching"
import {CacheFirst, NetworkFirst} from "workbox-strategies"
import {registerRoute, setDefaultHandler} from "workbox-routing"
import {ExpirationPlugin} from "workbox-expiration"


precacheAndRoute(self.__WB_MANIFEST)

declare const self: ServiceWorkerGlobalScope


function wrap_response_with_cache_header(response: Response, cached: boolean = false): Response {
    let new_headers = new Headers(response.headers);
    if (cached)
        new_headers.set("X-Cached", "true");
    else
        new_headers.set("X-Cached", "false");
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new_headers
    });
}

class CustomNetworkFirst extends NetworkFirst {
    async handle({request, event}: any): Promise<Response> {
        try {
            let response: Response = await super.handle({request, event});
            return wrap_response_with_cache_header(response, false);
        }
        catch (error) {
            let cache: Cache = await caches.open(this.cacheName || "");
            let cached_response: Response | undefined = await cache.match(request);
            if (cached_response && cached_response.type !== "opaque") {
                return wrap_response_with_cache_header(cached_response, true);
            }
            return new Response(
                JSON.stringify({
                    code: 408,
                    message: "Нет интернет соединения",
                    error: "Network error",
                    offline: true,
                }),
                {
                    status: 408,
                    statusText: "Network error",
                    headers: {"Content-Type": "application/json"}
                }
            );
        }
    }
}

class CustomCacheFirst extends CacheFirst {
    async handle({request, event}: any): Promise<Response> {
        let cached_response: Response | undefined = await caches.match(request);
        if (cached_response && cached_response.type !== "opaque") {
            return wrap_response_with_cache_header(cached_response, true);
        }
        try {
            let response: Response = await super.handle({request, event});
            let cache: Cache = await caches.open(this.cacheName || "");
            await cache.put(request, response.clone());
            return wrap_response_with_cache_header(response, false);
        }
        catch (error) {
            return new Response(
                JSON.stringify({
                    code: 408,
                    message: "Нет интернет соединения",
                    error: "Network error",
                    offline: true,
                }),
                {
                    status: 408,
                    statusText: "Network error",
                    headers: {"Content-Type": "application/json"}
                }
            );
        }
    }
}


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
    new CustomCacheFirst({
        cacheName: "static",
        plugins: [
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60,
            })
        ]
    })
);

setDefaultHandler(
    new CustomNetworkFirst({
        cacheName: "default",
        networkTimeoutSeconds: 5,
        plugins: [
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 60 * 60,
            })
        ]
    })
);
