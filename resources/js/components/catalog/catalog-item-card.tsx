import type { CatalogItemRow } from '@/components/catalog/types';
import { StatusPill } from '@/components/common/status-pill';
import { CatalogItemActions } from '@/components/catalog/catalog-item-actions';
import {
    getCatalogItemIcon,
    getCatalogTypeTheme,
} from '@/lib/catalog-visual';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type CatalogItemCardProps = {
    item: CatalogItemRow;
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: () => void;
    onDelete: () => void;
};

export function CatalogItemCard({
    item,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
}: CatalogItemCardProps) {
    const { t } = useTranslations();
    const theme = getCatalogTypeTheme(item.type);
    const ItemIcon = getCatalogItemIcon(item.type, item.slug, item.icon);

    return (
        <article
            className={cn(
                'group flex items-start gap-2.5 rounded-xl border p-3 transition-all duration-200 hover:shadow-md',
                theme.card,
                !item.active && 'opacity-70',
            )}
        >
            <span
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    theme.iconWrap,
                )}
            >
                <ItemIcon className="size-4" />
            </span>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                    {item.name_es}
                </p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {item.slug}
                </p>
                {!item.active && (
                    <StatusPill variant="muted" className="mt-1.5">
                        {t('catalog.inactive')}
                    </StatusPill>
                )}
            </div>

            <CatalogItemActions
                canUpdate={canUpdate}
                canDelete={canDelete}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </article>
    );
}
