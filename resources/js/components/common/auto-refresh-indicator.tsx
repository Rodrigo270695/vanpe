import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AutoRefreshIndicatorProps = {
    intervalLabel: string;
    agoLabel: string;
    refreshLabel: string;
    isRefreshing?: boolean;
    onRefresh: () => void;
    className?: string;
};

export function AutoRefreshIndicator({
    intervalLabel,
    agoLabel,
    refreshLabel,
    isRefreshing = false,
    onRefresh,
    className,
}: AutoRefreshIndicatorProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground',
                className,
            )}
        >
            <span className="whitespace-nowrap">{intervalLabel}</span>
            <span
                className="size-1.5 shrink-0 rounded-full bg-emerald-500"
                aria-hidden
            />
            <span className="whitespace-nowrap">{agoLabel}</span>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label={refreshLabel}
            >
                <RefreshCw
                    className={cn('size-3.5', isRefreshing && 'animate-spin')}
                />
            </Button>
        </div>
    );
}
