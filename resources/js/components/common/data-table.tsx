import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

export type SortState = { key: string; dir: 'asc' | 'desc' } | null;

export type DataTableColumn<T> = {
    /** Identificador de la columna (y clave de orden por defecto). */
    key: string;
    header: ReactNode;
    /** Render personalizado de la celda. Si falta usa row[key]. */
    render?: (row: T) => ReactNode;
    /** Habilita el orden por esta columna. */
    sortable?: boolean;
    /** Clave usada para ordenar (por defecto `key`). */
    sortKey?: string;
    align?: 'left' | 'center' | 'right';
    /** Clases extra para las celdas/encabezado. */
    className?: string;
    /** Oculta la columna en la vista de card (móvil). */
    hideOnCard?: boolean;
};

type DataTableProps<T> = {
    columns: DataTableColumn<T>[];
    data: T[];
    rowKey: (row: T) => string | number;
    /** Estado de orden controlado. */
    sort?: SortState;
    /** Se llama con la sortKey al pulsar un encabezado ordenable. */
    onSort?: (key: string) => void;
    /** Columna de acciones (botones) al final de cada fila/card. */
    actions?: (row: T) => ReactNode;
    /** Título destacado de cada card (móvil). Por defecto la 1.ª columna. */
    cardTitle?: (row: T) => ReactNode;
    emptyMessage?: string;
    className?: string;
};

const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
} as const;

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
    if (!active) return <ArrowUpDown className="size-3.5 opacity-50" />;
    return dir === 'asc' ? (
        <ArrowUp className="size-3.5" />
    ) : (
        <ArrowDown className="size-3.5" />
    );
}

/**
 * Tabla de datos reutilizable (componente padre).
 * - En pantallas grandes se muestra como tabla.
 * - En móvil cada fila se muestra como card.
 */
export function DataTable<T>({
    columns,
    data,
    rowKey,
    sort,
    onSort,
    actions,
    cardTitle,
    emptyMessage,
    className,
}: DataTableProps<T>) {
    const { t } = useTranslations();
    const resolvedEmptyMessage = emptyMessage ?? t('table.empty_default');

    const cellValue = (col: DataTableColumn<T>, row: T): ReactNode =>
        col.render ? col.render(row) : ((row as Record<string, ReactNode>)[col.key] ?? '—');

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
                    <Inbox className="size-7" />
                </span>
                <p className="text-sm font-medium text-foreground">
                    {resolvedEmptyMessage}
                </p>
            </div>
        );
    }

    const titleRender = cardTitle ?? ((row: T) => cellValue(columns[0], row));

    return (
        <div className={cn('w-full', className)}>
            {/* Vista tabla (desktop) */}
            <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="clay-thead text-left">
                            {columns.map((col) => {
                                const key = col.sortKey ?? col.key;
                                const isActive = sort?.key === key;
                                return (
                                    <th
                                        key={col.key}
                                        className={cn(
                                            'px-4 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap',
                                            alignClass[col.align ?? 'left'],
                                            col.className,
                                        )}
                                    >
                                        {col.sortable && onSort ? (
                                            <button
                                                type="button"
                                                onClick={() => onSort(key)}
                                                className={cn(
                                                    'inline-flex cursor-pointer items-center gap-1.5 transition-colors duration-150 hover:text-brand-blue',
                                                    col.align === 'right' &&
                                                        'flex-row-reverse',
                                                )}
                                            >
                                                {col.header}
                                                <SortIcon
                                                    active={isActive}
                                                    dir={sort?.dir ?? 'asc'}
                                                />
                                            </button>
                                        ) : (
                                            col.header
                                        )}
                                    </th>
                                );
                            })}
                            {actions && (
                                <th className="px-4 py-2.5 text-right text-xs font-semibold tracking-wide">
                                    {t('table.actions')}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row) => (
                            <tr
                                key={rowKey(row)}
                                className="border-t border-border/70 transition-colors duration-150 odd:bg-muted/15 hover:bg-brand-blue/8"
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={cn(
                                            'px-4 py-2 text-[13px] text-foreground',
                                            alignClass[col.align ?? 'left'],
                                            col.className,
                                        )}
                                    >
                                        {cellValue(col, row)}
                                    </td>
                                ))}
                                {actions && (
                                    <td className="px-4 py-2 text-right">
                                        <div className="flex items-center justify-end">
                                            {actions(row)}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Vista card (móvil) */}
            <div className="grid gap-3 p-3 md:hidden">
                {data.map((row) => (
                    <div
                        key={rowKey(row)}
                        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <div className="p-4">
                            <div className="text-[15px] leading-tight font-semibold text-foreground">
                                {titleRender(row)}
                            </div>

                            <dl className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/20">
                                {columns
                                    .filter((col, i) => i !== 0 && !col.hideOnCard)
                                    .map((col) => (
                                        <div
                                            key={col.key}
                                            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                                        >
                                            <dt className="text-muted-foreground">
                                                {col.header}
                                            </dt>
                                            <dd className="text-right font-medium text-foreground">
                                                {cellValue(col, row)}
                                            </dd>
                                        </div>
                                    ))}
                            </dl>
                        </div>

                        {actions && (
                            <div className="flex items-center justify-end gap-1 border-t border-border bg-muted/40 px-3 py-2">
                                {actions(row)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
