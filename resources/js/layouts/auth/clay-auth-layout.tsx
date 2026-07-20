import { Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck,
    ChevronRight,
    MapPin,
    ShieldCheck,
    Sparkles,
    Star,
    UtensilsCrossed,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { LanguageToggle } from '@/components/language-toggle';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { home, login, register } from '@/routes';

type PageMeta = {
    title: string;
    description: string;
    badge: string;
    footPrompt: string;
    footLink: string;
    footHref: string;
};

export default function ClayAuthLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslations();
    const component = usePage().component;

    const meta: Record<string, PageMeta> = {
        'auth/login': {
            title: t('auth.login_title'),
            description: t('auth.login_subtitle'),
            badge: t('auth.card_badge'),
            footPrompt: t('auth.no_account'),
            footLink: t('auth.sign_up'),
            footHref: register().url,
        },
        'auth/register': {
            title: t('auth.register_title'),
            description: t('auth.register_subtitle'),
            badge: t('auth.card_badge_register'),
            footPrompt: t('auth.have_account'),
            footLink: t('auth.sign_in'),
            footHref: login().url,
        },
        'auth/forgot-password': {
            title: t('auth.forgot_title'),
            description: t('auth.forgot_subtitle'),
            badge: t('auth.card_badge_forgot'),
            footPrompt: t('auth.back_to_login'),
            footLink: t('auth.sign_in'),
            footHref: login().url,
        },
        'auth/complete-registration': {
            title: t('auth.onboarding_title'),
            description: t('auth.onboarding_subtitle'),
            badge: t('auth.card_badge_onboarding'),
            footPrompt: t('auth.have_account'),
            footLink: t('auth.sign_in'),
            footHref: login().url,
        },
        'auth/accept-invitation': {
            title: t('auth.invite_title'),
            description: t('auth.invite_subtitle'),
            badge: t('auth.card_badge_invite'),
            footPrompt: t('auth.have_account'),
            footLink: t('auth.sign_in'),
            footHref: login().url,
        },
    };

    const current = meta[component] ?? meta['auth/login'];

    const features = [
        { icon: MapPin, label: t('auth.feature_spots') },
        { icon: UtensilsCrossed, label: t('auth.feature_restaurants') },
        { icon: CalendarCheck, label: t('auth.feature_reservations') },
    ];

    const stats = [
        { value: '+120', label: t('auth.stat_places') },
        { value: '+50', label: t('auth.stat_restaurants') },
        { value: '4.9', label: t('auth.stat_rating'), star: true },
    ];

    return (
        <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
            {/* ── Panel de marca ── */}
            <aside className="bg-brand-gradient relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
                <div className="animate-blob pointer-events-none absolute -top-24 -left-16 h-96 w-96 rounded-full bg-brand-orange/30 blur-3xl" />
                <div className="animate-blob pointer-events-none absolute -right-24 -bottom-16 h-112 w-md rounded-full bg-brand-blue-light/40 blur-3xl [animation-delay:-6s]" />
                <div className="bg-dot-grid pointer-events-none absolute inset-0 opacity-60" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-brand-blue-deep/50 to-transparent" />

                {/* Sol decorativo */}
                <div className="animate-spin-slow pointer-events-none absolute -top-16 right-10 opacity-90">
                    <svg width="180" height="180" viewBox="0 0 100 100" fill="none">
                        <circle
                            cx="50"
                            cy="50"
                            r="20"
                            fill="var(--color-brand-sun)"
                        />
                        {Array.from({ length: 12 }).map((_, i) => (
                            <rect
                                key={i}
                                x="48.5"
                                y="6"
                                width="3"
                                height="12"
                                rx="1.5"
                                fill="var(--color-brand-sun)"
                                transform={`rotate(${i * 30} 50 50)`}
                            />
                        ))}
                    </svg>
                </div>

                {/* Logo */}
                <div className="relative z-10">
                    <Link
                        href={home()}
                        className="inline-flex items-center rounded-2xl bg-white/95 px-4 py-3 shadow-lg shadow-black/10 ring-1 ring-white/40 backdrop-blur"
                    >
                        <img
                            src="/vamospe-01.png"
                            alt="VanPe"
                            className="h-11 w-auto object-contain"
                        />
                    </Link>
                    <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/20 backdrop-blur">
                        <Sparkles className="size-3.5 text-brand-sun" />
                        {t('auth.brand_tagline')}
                    </p>
                </div>

                {/* Titular */}
                <div className="relative z-10 max-w-md">
                    <h2 className="text-5xl leading-[1.05] font-extrabold tracking-tight text-white xl:text-6xl">
                        {t('auth.brand_line1')}{' '}
                        <span className="text-brand-orange-light">
                            {t('auth.brand_line2')}
                        </span>
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-white/80">
                        {t('auth.brand_desc')}
                    </p>

                    <ul className="mt-8 flex flex-col gap-3">
                        {features.map(({ icon: Icon, label }) => (
                            <li
                                key={label}
                                className="group flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur transition-all hover:translate-x-1 hover:bg-white/15"
                            >
                                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-orange text-white shadow-lg shadow-brand-orange/40 ring-1 ring-white/25">
                                    <Icon className="size-5" />
                                </span>
                                {label}
                                <ChevronRight className="ml-auto size-4 text-white/50 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 grid grid-cols-3 gap-3">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-2xl bg-white/10 px-3 py-3 text-center ring-1 ring-white/15 backdrop-blur"
                            >
                                <p className="flex items-center justify-center gap-1 text-xl font-extrabold text-white">
                                    {stat.value}
                                    {stat.star && (
                                        <Star className="size-4 fill-brand-sun text-brand-sun" />
                                    )}
                                </p>
                                <p className="mt-0.5 text-[11px] font-medium tracking-wide text-white/60 uppercase">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative z-10 text-xs text-white/60">
                    © {new Date().getFullYear()} VanPe — Perú
                </p>
            </aside>

            {/* ── Panel del formulario ── */}
            <main className="relative flex flex-col overflow-hidden bg-linear-to-br from-[#eaf1ff] via-[#e4edfd] to-[#d7e3fb] px-6 py-8 sm:px-10 lg:px-14 dark:from-[#0a1326] dark:via-[#0b1730] dark:to-[#091022]">
                <div className="animate-blob pointer-events-none absolute -top-24 -right-28 h-80 w-80 rounded-full bg-brand-blue/15 blur-3xl" />
                <div className="animate-blob pointer-events-none absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-brand-orange/10 blur-3xl [animation-delay:-8s]" />
                <div className="animate-float-slow pointer-events-none absolute top-1/3 -right-10 h-40 w-40 rounded-full bg-brand-blue-light/10 blur-2xl" />
                <div className="bg-dot-grid-blue pointer-events-none absolute inset-0 opacity-70" />

                <div className="relative z-10 flex items-center justify-between">
                    <Link
                        href={home()}
                        className="flex items-center gap-2 lg:hidden"
                    >
                        <img
                            src="/vamospe-01.png"
                            alt="VanPe"
                            className="h-9 w-auto object-contain"
                        />
                    </Link>
                    <div className="ml-auto">
                        <LanguageToggle />
                    </div>
                </div>

                <div className="relative z-10 flex flex-1 items-center justify-center">
                    <div className="flip-perspective w-full max-w-md">
                        {/* key por página → remonta y dispara el giro */}
                        <div key={component} className="animate-card-flip">
                            <div className="mb-6 text-center lg:text-left">
                                <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-brand-blue/10 lg:hidden">
                                    <img
                                        src="/vamospe-05.png"
                                        alt="VanPe"
                                        className="size-10 object-contain"
                                    />
                                </span>
                                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                                    {current.title}
                                </h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {current.description}
                                </p>
                            </div>

                            <Card className="clay-card relative gap-0 py-0">
                                <CardContent className="flex flex-col gap-4 p-6 sm:p-7">
                                    <div className="flex items-center gap-3">
                                        <span className="clay-soft flex size-11 items-center justify-center">
                                            <img
                                                src="/vamospe-05.png"
                                                alt="VanPe"
                                                className="size-6 object-contain"
                                            />
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-white">
                                                VanPe
                                            </span>
                                            <span className="text-xs text-white/70">
                                                {current.badge}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-px w-full bg-white/20" />

                                    {children}

                                    <div className="mt-1 flex items-center justify-center gap-1.5 border-t border-white/20 pt-4 text-xs text-white/70">
                                        <ShieldCheck className="size-3.5 text-brand-orange-light" />
                                        {t('auth.secure_note')}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="mt-6 text-center text-sm text-muted-foreground">
                                {current.footPrompt}{' '}
                                <Link
                                    href={current.footHref}
                                    className="font-semibold text-brand-blue hover:text-brand-orange dark:text-brand-blue-light"
                                >
                                    {current.footLink}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
