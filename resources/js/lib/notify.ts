import { toast } from 'sonner';

/**
 * Notificaciones (toast) para mensajes manuales desde el frontend.
 * Los mensajes flash del backend se muestran automáticamente vía useFlashToast.
 */
export const notify = {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    warning: (message: string) => toast.warning(message),
    info: (message: string) => toast.info(message),
};
