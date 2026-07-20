import { Head, router } from '@inertiajs/react';
import {
    Ban,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    Clock,
    ListFilter,
    Plus,
    UserCheck,
    UserX,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { DateRangeFilter } from '@/components/common/date-range-filter';
import { PageHeader } from '@/components/common/page-header';
import { TableFilterSelect } from '@/components/common/table-filter-select';
import { ReservationCard } from '@/components/reservas/reservation-card';
import { ReservationFormModal } from '@/components/reservas/reservation-form-modal';
import { SeatTableModal } from '@/components/reservas/seat-table-modal';
import { WaitingListPanel } from '@/components/reservas/waiting-list-panel';
import type {
    ReservationRow,
    ReservasAbilities,
    ReservasAreaOption,
    ReservasFilters,
    ReservasStats,
    ReservasTimelineSlot,
    WaitingListRow,
} from '@/components/reservas/types';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import type { DateRange } from '@/lib/date-range';
import { translate, type TranslationTree } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type ReservasTab = 'reservas' | 'lista_espera';

type ReservasPageProps = {
    reservations: ReservationRow[];
    pending_approval: ReservationRow[];
    timeline: ReservasTimelineSlot[];
    waiting_list: WaitingListRow[];
    waiting_count: number;
    areas: ReservasAreaOption[];
    filters: ReservasFilters;
    statuses: string[];
    sources: string[];
    stats: ReservasStats;
    settings: { reservations_enabled: boolean };
    can: ReservasAbilities;
};

export default function ReservasIndex({
    reservations,
    pending_approval,
    timeline,
    waiting_list,
    waiting_count,
    areas,
    filters,
    statuses,
    sources,
    stats,
    settings,
    can,
}: ReservasPageProps) {
    const { t } = useTranslations();
    const [activeTab, setActiveTab] = useState<ReservasTab>('reservas');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ReservationRow | null>(null);
    const [seatTarget, setSeatTarget] = useState<ReservationRow | null>(null);

    const statusLabel = (status: string) =>
        t(`reservas.status_${status}` as 'reservas.status_pending');

    const sourceLabel = (source: string) =>
        t(`reservas.source_${source}` as 'reservas.source_manual');

    const applyFilters = (next: Partial<ReservasFilters>) => {
        router.get(
            '/reservas',
            {
                date_from: next.date_from ?? filters.date_from,
                date_to: next.date_to ?? filters.date_to,
                status: next.status ?? filters.status,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const dateRange: DateRange = {
        from: filters.date_from,
        to: filters.date_to,
    };

    const isSingleDay = filters.date_from === filters.date_to;

    const statusFilterOptions = useMemo(
        () => [
            {
                value: 'all',
                label: t('reservas.filter_all'),
                icon: ListFilter,
                tone: 'muted' as const,
            },
            ...statuses.map((status) => {
                const iconTone = {
                    pending: { icon: Clock, tone: 'orange' as const },
                    confirmed: { icon: CheckCircle2, tone: 'blue' as const },
                    seated: { icon: UserCheck, tone: 'green' as const },
                    completed: { icon: CheckCircle2, tone: 'green' as const },
                    no_show: { icon: UserX, tone: 'purple' as const },
                    cancelled_customer: { icon: Ban, tone: 'gray' as const },
                    cancelled_restaurant: { icon: Ban, tone: 'gray' as const },
                }[status] ?? { icon: ListFilter, tone: 'muted' as const };

                return {
                    value: status,
                    label: statusLabel(status),
                    icon: iconTone.icon,
                    tone: iconTone.tone,
                };
            }),
        ],
        [statuses, t],
    );

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (row: ReservationRow) => {
        setEditing(row);
        setFormOpen(true);
    };

    return (
        <>
            <Head title={t('reservas.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('reservas.title')}
                    description={t('reservas.description')}
                    badges={[
                        {
                            label: isSingleDay
                                ? t('reservas.badge_total')
                                : t('reservas.badge_in_range'),
                            value: stats.total,
                            color: 'blue',
                            icon: CalendarDays,
                        },
                        {
                            label: t('reservas.badge_pending'),
                            value: stats.pending,
                            color: 'yellow',
                            icon: Clock,
                        },
                        {
                            label: t('reservas.badge_confirmed'),
                            value: stats.confirmed,
                            color: 'teal',
                            icon: CalendarClock,
                        },
                        {
                            label: t('reservas.badge_seated'),
                            value: stats.seated,
                            color: 'green',
                            icon: Users,
                        },
                    ]}
                    action={
                        can.manage
                            ? {
                                  label: t('reservas.new'),
                                  onClick: openCreate,
                                  icon: Plus,
                              }
                            : undefined
                    }
                />

                {!settings.reservations_enabled && (
                    <p className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-[13px] text-amber-900">
                        {t('reservas.disabled_hint')}
                    </p>
                )}

                <div className="flex gap-2 border-b border-border px-4 md:px-6">
                    <button
                        type="button"
                        onClick={() => setActiveTab('reservas')}
                        className={cn(
                            'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                            activeTab === 'reservas'
                                ? 'border-brand-blue text-brand-blue'
                                : 'border-transparent text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {t('reservas.tab_reservations')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('lista_espera')}
                        className={cn(
                            'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                            activeTab === 'lista_espera'
                                ? 'border-brand-blue text-brand-blue'
                                : 'border-transparent text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {t('lista_espera.tab')}
                        {waiting_count > 0 ? (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                                {waiting_count}
                            </span>
                        ) : null}
                    </button>
                </div>

                {activeTab === 'lista_espera' ? (
                    <div className="px-4 pb-6 md:px-6">
                        <WaitingListPanel
                            entries={waiting_list}
                            areas={areas}
                            canManage={can.manage}
                        />
                    </div>
                ) : (
                    <>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between px-4 md:px-6">
                    <DateRangeFilter
                        value={dateRange}
                        onChange={(range) =>
                            applyFilters({
                                date_from: range.from,
                                date_to: range.to,
                            })
                        }
                    />
                    <TableFilterSelect
                        value={filters.status || 'all'}
                        onChange={(status) =>
                            applyFilters({
                                status: status === 'all' ? '' : status,
                            })
                        }
                        options={statusFilterOptions}
                        placeholder={t('reservas.filter_all')}
                        triggerClassName="min-w-[13rem]"
                    />
                </div>

                {pending_approval.length > 0 ? (
                    <div className="mx-4 space-y-3 md:mx-6">
                        <h2 className="text-sm font-semibold text-amber-900">
                            {t('reservas.pending_section_title')}
                        </h2>
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {pending_approval.map((reservation) => (
                                <ReservationCard
                                    key={`pending-${reservation.id}`}
                                    reservation={reservation}
                                    statusLabel={statusLabel(reservation.status)}
                                    sourceLabel={sourceLabel(reservation.source)}
                                    partyLabel={t('reservas.party_label', {
                                        count: reservation.party_size,
                                    })}
                                    tablesLabel={t('reservas.tables_label', {
                                        numbers: reservation.tables
                                            .map((tbl) => tbl.number)
                                            .join(', '),
                                    })}
                                    canManage={can.manage}
                                    onEdit={() => openEdit(reservation)}
                                    labels={{
                                        confirm: t('reservas.action_confirm'),
                                        reject: t('reservas.action_reject'),
                                        seat: t('reservas.action_seat'),
                                        complete: t('reservas.action_complete'),
                                        noShow: t('reservas.action_no_show'),
                                        cancel: t('reservas.action_cancel'),
                                        pendingApproval: t('reservas.pending_approval'),
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ) : null}

                {isSingleDay && timeline.length > 0 ? (
                    <div className="mx-4 space-y-4 md:mx-6">
                        <h2 className="text-sm font-semibold text-muted-foreground">
                            {t('reservas.timeline_title')}
                        </h2>
                        {timeline.map((slot) => (
                            <div key={slot.hour} className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                                    {slot.label}
                                </p>
                                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                    {slot.reservations.map((reservation) => (
                                        <ReservationCard
                                            key={`tl-${reservation.id}`}
                                            reservation={reservation}
                                            statusLabel={statusLabel(reservation.status)}
                                            sourceLabel={sourceLabel(reservation.source)}
                                            partyLabel={t('reservas.party_label', {
                                                count: reservation.party_size,
                                            })}
                                            tablesLabel={t('reservas.tables_label', {
                                                numbers: reservation.tables
                                                    .map((tbl) => tbl.number)
                                                    .join(', '),
                                            })}
                                            canManage={can.manage}
                                            onEdit={() => openEdit(reservation)}
                                            onSeat={() => setSeatTarget(reservation)}
                                            labels={{
                                                confirm: t('reservas.action_confirm'),
                                                reject: t('reservas.action_reject'),
                                                seat: t('reservas.action_seat'),
                                                complete: t('reservas.action_complete'),
                                                noShow: t('reservas.action_no_show'),
                                                cancel: t('reservas.action_cancel'),
                                                pendingApproval: t('reservas.pending_approval'),
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}

            {reservations.length === 0 ? (
                <div className="mx-4 mb-6 rounded-xl border border-dashed border-teal-200/80 bg-teal-50/30 p-10 text-center md:mx-6">
                    <CalendarClock className="mx-auto mb-3 size-10 text-teal-500/60" />
                    <p className="text-sm text-muted-foreground">
                        {t('reservas.empty')}
                    </p>
                    {can.manage && (
                        <Button
                            className="mt-4 cursor-pointer"
                            onClick={openCreate}
                        >
                            <Plus className="size-4" />
                            {t('reservas.new')}
                        </Button>
                    )}
                </div>
            ) : !isSingleDay || timeline.length === 0 ? (
                <div className="grid gap-3 px-4 pb-6 md:grid-cols-2 md:px-6 xl:grid-cols-3">
                    {reservations.map((reservation) => (
                        <ReservationCard
                            key={reservation.id}
                            reservation={reservation}
                            statusLabel={statusLabel(reservation.status)}
                            sourceLabel={sourceLabel(reservation.source)}
                            partyLabel={t('reservas.party_label', {
                                count: reservation.party_size,
                            })}
                            tablesLabel={t('reservas.tables_label', {
                                numbers: reservation.tables
                                    .map((tbl) => tbl.number)
                                    .join(', '),
                            })}
                            canManage={can.manage}
                            onEdit={() => openEdit(reservation)}
                            onSeat={() => setSeatTarget(reservation)}
                            labels={{
                                confirm: t('reservas.action_confirm'),
                                reject: t('reservas.action_reject'),
                                seat: t('reservas.action_seat'),
                                complete: t('reservas.action_complete'),
                                noShow: t('reservas.action_no_show'),
                                cancel: t('reservas.action_cancel'),
                                pendingApproval: t('reservas.pending_approval'),
                            }}
                        />
                    ))}
                </div>
            ) : null}

                    </>
                )}
            </div>

            {seatTarget ? (
                <SeatTableModal
                    open={seatTarget !== null}
                    onOpenChange={(open) => !open && setSeatTarget(null)}
                    title={t('reservas.seat_title')}
                    description={seatTarget.customer_name}
                    submitUrl={`/reservas/${seatTarget.id}/seat`}
                    areas={areas}
                    partySize={seatTarget.party_size}
                    multiple
                />
            ) : null}

            <ReservationFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                reservation={editing}
                areas={areas}
                sources={sources}
                defaultDate={filters.date_from}
            />
        </>
    );
}

ReservasIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'reservas.title',
            ),
            href: '/reservas',
        },
    ],
});
