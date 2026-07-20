import { Head } from '@inertiajs/react';
import { ChefHat, ClipboardCheck, Flame } from 'lucide-react';
import { AutoRefreshIndicator } from '@/components/common/auto-refresh-indicator';
import { PageHeader } from '@/components/common/page-header';
import { KitchenOrderCard } from '@/components/cocina/kitchen-order-card';
import type {
    CocinaAbilities,
    CocinaStats,
    KitchenOrderRow,
} from '@/components/cocina/types';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import { useTranslations } from '@/hooks/use-translations';
import { translate, type TranslationTree } from '@/lib/i18n';

type CocinaIndexProps = {
    orders: KitchenOrderRow[];
    stats: CocinaStats;
    can: CocinaAbilities;
};

const REFRESH_MS = 10_000;
const COCINA_RELOAD_PROPS = ['orders', 'stats'];

export default function CocinaIndex({ orders, stats, can }: CocinaIndexProps) {
    const { t } = useTranslations();

    const { secondsAgo, intervalSeconds, isRefreshing, refresh } =
        useAutoRefresh({
            intervalMs: REFRESH_MS,
            only: COCINA_RELOAD_PROPS,
        });

    const preparingOrders = orders
        .map((order) => ({
            ...order,
            items: order.items.filter(
                (item) => item.kitchen_status === 'preparing',
            ),
        }))
        .filter((order) => order.items.length > 0);

    const readyOrders = orders
        .map((order) => ({
            ...order,
            items: order.items.filter(
                (item) => item.kitchen_status === 'ready',
            ),
        }))
        .filter((order) => order.items.length > 0);

    const cardProps = {
        markReadyLabel: t('cocina.mark_ready'),
        statusPreparingLabel: t('cocina.status_preparing'),
        statusReadyLabel: t('cocina.status_ready'),
        tableLabel: t('cocina.table'),
        orderLabel: t('cocina.order'),
        canManage: can.manage,
    };

    return (
        <>
            <Head title={t('cocina.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('cocina.title')}
                    description={t('cocina.description')}
                    badges={[
                        {
                            label: t('cocina.badge_orders'),
                            value: stats.orders,
                            color: 'orange',
                            icon: ChefHat,
                        },
                        {
                            label: t('cocina.badge_preparing'),
                            value: stats.preparing,
                            color: 'yellow',
                            icon: Flame,
                        },
                        {
                            label: t('cocina.badge_ready'),
                            value: stats.ready,
                            color: 'green',
                            icon: ClipboardCheck,
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

                {orders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                        <ChefHat className="mx-auto mb-3 size-10 text-muted-foreground/60" />
                        <p className="text-base font-medium text-foreground">
                            {t('cocina.empty')}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('cocina.empty_hint')}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 xl:grid-cols-2">
                        <section className="flex flex-col gap-4">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Flame className="size-4 text-amber-600" />
                                {t('cocina.column_preparing')}
                                <span className="font-mono text-xs font-normal text-muted-foreground">
                                    ({stats.preparing})
                                </span>
                            </h2>

                            {preparingOrders.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                                    {t('cocina.column_preparing_empty')}
                                </p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {preparingOrders.map((order) => (
                                        <KitchenOrderCard
                                            key={`prep-${order.id}`}
                                            order={order}
                                            {...cardProps}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="flex flex-col gap-4">
                            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <ClipboardCheck className="size-4 text-emerald-600" />
                                {t('cocina.column_ready')}
                                <span className="font-mono text-xs font-normal text-muted-foreground">
                                    ({stats.ready})
                                </span>
                            </h2>

                            {readyOrders.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                                    {t('cocina.column_ready_empty')}
                                </p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {readyOrders.map((order) => (
                                        <KitchenOrderCard
                                            key={`ready-${order.id}`}
                                            order={order}
                                            {...cardProps}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </>
    );
}

CocinaIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'cocina.title',
            ),
            href: '/cocina',
        },
    ],
});
