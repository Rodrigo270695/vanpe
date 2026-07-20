import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type PaginationProps = {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    perPageOptions?: number[];
    className?: string;
};

/** Devuelve la ventana de páginas a mostrar (con elipsis). */
function pageWindow(current: number, totalPages: number): (number | '…')[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '…')[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);

    if (start > 2) pages.push('…');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('…');
    pages.push(totalPages);

    return pages;
}

/** Paginación reutilizable: rango, selector de tamaño y navegación. */
export function Pagination({
    page,
    perPage,
    total,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
    className,
}: PaginationProps) {
    const { t } = useTranslations();
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(page * perPage, total);

    return (
        <div
            className={cn(
                'flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span>
                    {t('table.showing')}{' '}
                    <span className="font-semibold text-foreground">{from}</span>
                    {'–'}
                    <span className="font-semibold text-foreground">{to}</span>
                    {' '}
                    {t('table.of')}{' '}
                    <span className="font-semibold text-foreground">{total}</span>
                </span>

                {onPerPageChange && (
                    <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">
                            {t('table.rows_per_page')}
                        </span>
                        <Select
                            value={String(perPage)}
                            onValueChange={(v) => onPerPageChange(Number(v))}
                        >
                            <SelectTrigger
                                size="sm"
                                className="h-8 w-18 font-medium"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="center">
                                {perPageOptions.map((opt) => (
                                    <SelectItem key={opt} value={String(opt)}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="size-8 cursor-pointer"
                    onClick={() => onPageChange(1)}
                    disabled={page <= 1}
                    aria-label={t('table.first_page')}
                >
                    <ChevronsLeft className="size-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="size-8 cursor-pointer"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    aria-label={t('table.prev_page')}
                >
                    <ChevronLeft className="size-4" />
                </Button>

                {pageWindow(page, totalPages).map((p, i) =>
                    p === '…' ? (
                        <span
                            key={`gap-${i}`}
                            className="px-1.5 text-muted-foreground select-none"
                        >
                            …
                        </span>
                    ) : (
                        <Button
                            key={p}
                            variant={p === page ? 'default' : 'outline'}
                            size="icon"
                            className={cn(
                                'size-8 cursor-pointer font-semibold transition-transform',
                                p === page
                                    ? 'bg-brand-blue shadow-md shadow-brand-blue/30 hover:bg-brand-blue'
                                    : 'hover:scale-105 hover:border-brand-blue/30 hover:text-brand-blue',
                            )}
                            onClick={() => onPageChange(p)}
                            aria-current={p === page ? 'page' : undefined}
                        >
                            {p}
                        </Button>
                    ),
                )}

                <Button
                    variant="outline"
                    size="icon"
                    className="size-8 cursor-pointer"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    aria-label={t('table.next_page')}
                >
                    <ChevronRight className="size-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="size-8 cursor-pointer"
                    onClick={() => onPageChange(totalPages)}
                    disabled={page >= totalPages}
                    aria-label={t('table.last_page')}
                >
                    <ChevronsRight className="size-4" />
                </Button>
            </div>
        </div>
    );
}
