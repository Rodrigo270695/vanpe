import { Head, Link, usePage } from '@inertiajs/react';
import { BedDouble, CheckCircle2, Circle, Rocket } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';

type ChecklistItem = {
    key: string;
    done: boolean;
    href: string;
};

type Props = {
    hotel: {
        id: string;
        nombre: string;
        estado: string;
        publicado_en: string | null;
        imagen_portada_url: string | null;
        photos: number;
    } | null;
    min_photos: number;
    profile: {
        percent: number;
        checklist: ChecklistItem[];
    };
};

export default function HotelDashboard({ hotel, min_photos, profile }: Props) {
    const { t } = useTranslations();
    const { auth, tenant } = usePage().props;
    const userName = auth.user?.name?.split(' ')[0] ?? '';

    const checklistLabel = (key: string) =>
        key === 'photos'
            ? t('dashboard.hotel_check_photos', { min: min_photos })
            : t(`dashboard.hotel_check_${key}`);

    return (
        <>
            <Head title={t('nav.dashboard')} />
            <div className="flex flex-1 flex-col gap-6 p-4">
                <PageHeader
                    title={t('dashboard.greeting', { name: userName })}
                    description={t('dashboard.hotel_subtitle')}
                    badges={[
                        {
                            label: tenant?.name ?? t('nav.mi_hotel'),
                            color: 'blue',
                            icon: BedDouble,
                        },
                        {
                            label: t('mi_hotel.badge_status'),
                            value: hotel?.estado ?? 'borrador',
                            color:
                                hotel?.estado === 'publicado' ? 'green' : 'gray',
                        },
                        {
                            label: t('mi_hotel.badge_photos'),
                            value: `${hotel?.photos ?? 0}/${min_photos}`,
                            color:
                                (hotel?.photos ?? 0) >= min_photos
                                    ? 'green'
                                    : 'orange',
                        },
                        {
                            label: t('dashboard.profile_complete'),
                            value: `${profile.percent}%`,
                            color: profile.percent >= 80 ? 'green' : 'orange',
                        },
                    ]}
                >
                    <Button asChild>
                        <Link href="/mi-hotel">
                            <Rocket className="size-4" />
                            {t('nav.mi_hotel')}
                        </Link>
                    </Button>
                </PageHeader>

                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-2xl border bg-card p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold">
                                    {t('dashboard.hotel_checklist_title')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t('mi_hotel.publish_hint', {
                                        min: min_photos,
                                    })}
                                </p>
                            </div>
                            <Badge variant="secondary">{profile.percent}%</Badge>
                        </div>
                        <div className="space-y-2">
                            {profile.checklist.map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition hover:bg-muted/50"
                                >
                                    {item.done ? (
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                    ) : (
                                        <Circle className="size-4 text-muted-foreground" />
                                    )}
                                    <span className="text-sm font-medium">
                                        {checklistLabel(item.key)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-card p-5">
                        <p className="mb-3 text-sm font-semibold">
                            {hotel?.nombre ?? tenant?.name}
                        </p>
                        {hotel?.imagen_portada_url ? (
                            <img
                                src={hotel.imagen_portada_url}
                                alt=""
                                className="mb-4 aspect-video w-full rounded-xl object-cover"
                            />
                        ) : (
                            <div className="mb-4 flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                                {t('mi_hotel.tab_photos')}
                            </div>
                        )}
                        <Button asChild className="w-full">
                            <Link href="/mi-hotel">
                                {t('dashboard.hotel_open_profile')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
