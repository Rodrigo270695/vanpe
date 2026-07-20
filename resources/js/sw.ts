/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Solo precachea lo que vite-plugin-pwa inyecta (pwa icons); sin assets de build
// para evitar 404 cuando el SW vive en /sw.js con scope /.
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

type PushPayload = {
    title?: string;
    body?: string;
    url?: string;
    tag?: string;
};

self.addEventListener('push', (event) => {
    const payload = (event.data?.json() ?? {}) as PushPayload;

    event.waitUntil(
        self.registration.showNotification(payload.title ?? 'VanPe', {
            body: payload.body ?? '',
            icon: '/pwa/icon-192x192.png',
            badge: '/pwa/icon-96x96.png',
            tag: payload.tag,
            data: {
                url: payload.url ?? '/',
            },
        }),
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = (event.notification.data?.url as string | undefined) ?? '/';

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(targetUrl) && 'focus' in client) {
                        return client.focus();
                    }
                }

                if (self.clients.openWindow) {
                    return self.clients.openWindow(targetUrl);
                }

                return undefined;
            }),
    );
});

export {};
