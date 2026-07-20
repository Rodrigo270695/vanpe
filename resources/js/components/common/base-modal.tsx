import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type BaseModalSize = 'sm' | 'md' | 'lg' | 'xl';

type BaseModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    icon?: LucideIcon;
    iconClassName?: string;
    children: ReactNode;
    /** Se ejecuta al confirmar (botón principal o Enter). */
    onSubmit: () => void;
    submitLabel: string;
    cancelLabel?: string;
    /** El botón de confirmar solo se habilita cuando es `true`. */
    canSubmit?: boolean;
    /** Muestra estado de carga y bloquea el botón. */
    submitting?: boolean;
    /** Se dispara al TERMINAR de cerrar: úsalo para limpiar campos y errores. */
    onAfterClose?: () => void;
    submitVariant?: 'default' | 'destructive';
    size?: BaseModalSize;
    /**
     * Clases extra para el contenedor del modal. Permite que el consumidor
     * (hijo) cambie el ancho, p. ej. `contentClassName="sm:max-w-3xl"`.
     * Se aplica al final, así que gana sobre el `size` por defecto.
     */
    contentClassName?: string;
};

const sizeClasses: Record<BaseModalSize, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-xl',
    xl: 'sm:max-w-3xl',
};

/**
 * Modal base (padre) para formularios.
 *
 * Reglas de cierre: SOLO se cierra con Esc, la X o el botón Cancelar.
 * (Un clic fuera NO lo cierra, para evitar perder datos por accidente.)
 *
 * Al cerrarse dispara `onAfterClose`, pensado para limpiar los campos y las
 * validaciones del formulario. El botón de confirmar permanece deshabilitado
 * mientras `canSubmit` sea falso o `submitting` sea verdadero.
 */
export function BaseModal({
    open,
    onOpenChange,
    title,
    description,
    icon: Icon,
    iconClassName,
    children,
    onSubmit,
    submitLabel,
    cancelLabel,
    canSubmit = true,
    submitting = false,
    onAfterClose,
    submitVariant = 'default',
    size = 'md',
    contentClassName,
}: BaseModalProps) {
    const { t } = useTranslations();
    const wasOpen = useRef(open);

    // Limpieza al cerrar: dispara onAfterClose en la transición abierto → cerrado.
    useEffect(() => {
        if (wasOpen.current && !open) {
            onAfterClose?.();
        }
        wasOpen.current = open;
    }, [open, onAfterClose]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!canSubmit || submitting) {
            return;
        }
        onSubmit();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    'flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0',
                    sizeClasses[size],
                    contentClassName,
                )}
                // Bloquea el cierre al hacer clic o interactuar fuera del modal.
                onInteractOutside={(event) => event.preventDefault()}
                onPointerDownOutside={(event) => event.preventDefault()}
            >
                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    {/* Cabecera + separador */}
                    <DialogHeader className="shrink-0 border-b border-border bg-gradient-to-r from-brand-blue/[0.06] via-transparent to-brand-orange/[0.04] px-6 py-5">
                        <div className="flex items-start gap-3">
                            {Icon && (
                                <span
                                    className={cn(
                                        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue ring-1 ring-brand-blue/15',
                                        iconClassName,
                                    )}
                                >
                                    <Icon className="size-5" />
                                </span>
                            )}
                            <div className="min-w-0 space-y-1">
                                <DialogTitle className="text-lg">
                                    {title}
                                </DialogTitle>
                                {description && (
                                    <DialogDescription>
                                        {description}
                                    </DialogDescription>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Cuerpo con scroll (altura prudente) */}
                    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto bg-muted/20 px-6 py-5">
                        {children}
                    </div>

                    {/* Separador + botones */}
                    <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            {cancelLabel ?? t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant={submitVariant}
                            disabled={!canSubmit || submitting}
                        >
                            {submitLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
