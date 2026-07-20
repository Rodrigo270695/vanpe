import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TableCardProps = {
    /** Zona superior: filtros, búsqueda, acciones. */
    toolbar?: ReactNode;
    /** Zona inferior: normalmente la paginación. */
    footer?: ReactNode;
    children: ReactNode;
    className?: string;
    /** Si es `true`, el contenido va pegado a los bordes (sin padding). */
    flush?: boolean;
};

/**
 * Contenedor tipo card para tablas: barra superior (filtros), contenido y pie
 * (paginación). Da un marco consistente a cualquier listado.
 */
export function TableCard({
    toolbar,
    footer,
    children,
    className,
    flush = false,
}: TableCardProps) {
    return (
        <div
            className={cn(
                'flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
                className,
            )}
        >
            {toolbar && (
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                    {toolbar}
                </div>
            )}

            <div className={flush ? '' : 'p-4'}>{children}</div>

            {footer && (
                <div className="border-t border-border p-4">{footer}</div>
            )}
        </div>
    );
}
