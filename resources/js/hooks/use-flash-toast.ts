import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

type FlashProps = { flash?: { toast?: FlashToast & { id?: string } } };

/**
 * Muestra un toast cuando el backend envía un mensaje flash
 * (session `success` | `error` | `warning` | `info`).
 *
 * Usa los eventos del router de Inertia (no `usePage`) porque el `<Toaster>`
 * se monta fuera del árbol de Inertia. Deduplica por `id` para no repetir el
 * mismo mensaje entre eventos (`success` y `navigate` pueden dispararse juntos).
 */
export function useFlashToast(): void {
    const lastId = useRef<string | null>(null);

    useEffect(() => {
        const show = (props: FlashProps | undefined) => {
            const data = props?.flash?.toast;
            if (!data?.message || !data.id || data.id === lastId.current) {
                return;
            }
            lastId.current = data.id;
            toast[data.type](data.message);
        };

        const stopSuccess = router.on('success', (event) => {
            show(event.detail?.page?.props as FlashProps | undefined);
        });
        const stopNavigate = router.on('navigate', (event) => {
            show(event.detail?.page?.props as FlashProps | undefined);
        });

        return () => {
            stopSuccess();
            stopNavigate();
        };
    }, []);
}
