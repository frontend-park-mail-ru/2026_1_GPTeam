import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

/**
 * @description Предварительное кэширование ресурсов из манифеста сборки.
 */
precacheAndRoute(self.__WB_MANIFEST);

/**
 * @description Обработчик установки: немедленная активация.
 */
self.addEventListener("install", () => {
    self.skipWaiting();
});

/**
 * @description Обработчик активации: захват контроля над клиентами.
 */
self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

/**
 * @description Стратегия для статических ресурсов (стили, скрипты, изображения, шрифты).
 */
registerRoute(
    ({ request }) => 
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image' ||
        request.destination === 'font',
    new CacheFirst({
        cacheName: 'static-resources',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60,
            }),
        ],
    })
);

/**
 * @description Стратегия для навигационных запросов (HTML страницы).
 */
registerRoute(
    ({ request }) => request.mode === 'navigate',
    new StaleWhileRevalidate({
        cacheName: 'pages-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60,
            }),
        ],
    })
);

/**
 * @description Стратегия для справочников и перечислений (редко меняются).
 */
registerRoute(
    ({ url }) => url.pathname.startsWith('/enums/'),
    new CacheFirst({
        cacheName: 'api-enums-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 20,
                maxAgeSeconds: 7 * 24 * 60 * 60,
            }),
        ],
    })
);

/**
 * @description Стратегия для данных пользователя, бюджетов и транзакций.
 * Используется NetworkFirst, чтобы данные всегда были актуальными при наличии сети,
 * но приложение оставалось работоспособным в оффлайне.
 */
registerRoute(
    ({ url }) => 
        url.pathname.startsWith('/account') ||
        url.pathname.startsWith('/profile') ||
        url.pathname.startsWith('/get_budget') ||
        url.pathname.startsWith('/budget') ||
        url.pathname.startsWith('/transactions'),
    new NetworkFirst({
        cacheName: 'api-data-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60,
            }),
        ],
    })
);