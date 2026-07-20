import { Head } from '@inertiajs/react';
import { ClipboardList, UtensilsCrossed } from 'lucide-react';
import { AutoRefreshIndicator } from '@/components/common/auto-refresh-indicator';
import { PageHeader } from '@/components/common/page-header';
import { OrderTableCard } from '@/components/pedidos/order-table-card';
import type {
    PedidosAbilities,
    PedidosAreaRow,
    PedidosStats,
} from '@/components/pedidos/types';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { useTranslations } from '@/hooks/use-translations';
import { translate, type TranslationTree } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type PedidosIndexProps = {
    areas: PedidosAreaRow[];
    stats: PedidosStats;
    can: PedidosAbilities;
};

const areaThemes = [
    'border-brand-blue/15',
    'border-teal-200/60',
    'border-violet-200/60',
    'border-amber-200/60',
] as const;

const FLOOR_REFRESH_MS = 15_000;
const FLOOR_RELOAD_PROPS = ['areas', 'stats'];

export default function PedidosIndex({ areas, stats }: PedidosIndexProps) {
    const { t } = useTranslations();

    const { secondsAgo, intervalSeconds, isRefreshing, refresh } =
        useAutoRefresh({
            intervalMs: FLOOR_REFRESH_MS,
            only: FLOOR_RELOAD_PROPS,
        });

    const statusLabel = (status: string) =>
        t(`mesas.status_${status}` as 'mesas.status_free');

    const tableHref = (tableId: string, openOrderId: string | null) =>
        openOrderId
            ? `/pedidos/${openOrderId}`
            : `/pedidos/mesa/${tableId}`;

    return (
        <>
            <Head title={t('pedidos.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('pedidos.title')}
                    description={t('pedidos.description')}
                    badges={[
                        {
                            label: t('pedidos.badge_open'),
                            value: String(stats.open_orders),
                            color: 'orange',
                            icon: ClipboardList,
                        },
                        {
                            label: t('pedidos.badge_tables'),
                            value: String(stats.tables_with_order),
                            color: 'teal',
                            icon: UtensilsCrossed,
                        },
                    ]}
                >
                    <AutoRefreshIndicator
                        intervalLabel={t('common.auto_refresh_interval', {
                            seconds: intervalSeconds,
                        })}
                        agoLabel={t('common.auto_refresh_ago', {
                            seconds: secondsAgo,
                        })}
                        refreshLabel={t('common.auto_refresh_now')}
                        isRefreshing={isRefreshing}
                        onRefresh={refresh}
                    />
                </PageHeader>

                {areas.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                        {t('pedidos.empty_areas')}
                    </p>
                ) : (
                    <div className="flex flex-col gap-5">
                        {areas.map((area, index) => (
                            <section
                                key={area.id}
                                className={cn(
                                    'overflow-hidden rounded-2xl border bg-card shadow-sm',
                                    areaThemes[index % areaThemes.length],
                                )}
                            >
                                <div className="border-b border-white/60 bg-gradient-to-r from-slate-50/90 to-white px-4 py-3">
                                    <h2 className="text-[15px] font-semibold">
                                        {area.name}
                                    </h2>
                                </div>
                                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {area.tables.map((table) => (
                                        <OrderTableCard
                                            key={table.id}
                                            table={table}
                                            statusLabel={statusLabel(
                                                table.status,
                                            )}
                                            capacityLabel={t(
                                                'mesas.capacity_label',
                                                { count: table.capacity },
                                            )}
                                            hasOrderLabel={t(
                                                'pedidos.has_order',
                                            )}
                                            kitchenReadyLabel={t(
                                                'pedidos.floor_kitchen_ready',
                                                {
                                                    count: table.kitchen_ready_count,
                                                },
                                            )}
                                            kitchenAllReadyLabel={t(
                                                'pedidos.floor_kitchen_all_ready',
                                            )}
                                            inactiveLabel={t('mesas.inactive')}
                                            href={tableHref(
                                                table.id,
                                                table.open_order_id,
                                            )}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

PedidosIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'pedidos.title',
            ),
            href: '/pedidos',
        },
    ],
});
