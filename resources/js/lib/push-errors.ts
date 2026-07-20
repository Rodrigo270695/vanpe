import { isBraveBrowser } from '@/lib/browser-support';

const PUSH_SERVICE_ERROR_PATTERN = /push service error/i;

export function mapPushError(error: unknown): string {
    if (!(error instanceof Error)) {
        return 'No se pudo activar las notificaciones.';
    }

    const message = error.message.trim();

    if (PUSH_SERVICE_ERROR_PATTERN.test(message)) {
        if (isBraveBrowser()) {
            return 'Brave bloquea el servicio push de Google en local (FCM). Usa Chrome, Edge o Firefox para desarrollo, o desactiva Shields para este sitio. En producción con HTTPS suele funcionar.';
        }

        return 'El navegador no pudo conectar con el servicio de notificaciones. Borra los datos del sitio (DevTools → Application → Clear storage), recarga con Ctrl+F5 y vuelve a intentarlo.';
    }

    if (/no active service worker/i.test(message)) {
        return 'El service worker aún no está listo. Recarga la página e inténtalo de nuevo.';
    }

    if (/invalid vapid/i.test(message) || /se esperaban 65 bytes/i.test(message)) {
        return 'La clave VAPID del servidor no es válida. Regenera las claves VAPID y actualiza el archivo .env.';
    }

    return message;
}

export function isPushServiceError(error: unknown): boolean {
    return error instanceof Error && PUSH_SERVICE_ERROR_PATTERN.test(error.message);
}
