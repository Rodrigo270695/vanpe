import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { AppearanceToggle } from '@/components/appearance-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useTranslations } from '@/hooks/use-translations';
import { home } from '@/routes';

type LegalNavItem = {
    href: string;
    label: string;
    active: boolean;
};

export default function LegalLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslations();
    const page = usePage();
    const component = page.component;

    const navItems: LegalNavItem[] = [
        {
            href: '/privacidad',
            label: t('legal.nav.privacy'),
            active: component === 'legal/privacidad',
        },
        {
            href: '/terminos',
            label: t('legal.nav.terms'),
            active: component === 'legal/terminos',
        },
        {
            href: '/cookies',
            label: t('legal.nav.cookies'),
            active: component === 'legal/cookies',
        },
        {
            href: '/eliminacion-datos',
            label: t('legal.nav.deletion'),
            active: component === 'legal/eliminacion-datos',
        },
    ];

    return (
        <div className="min-h-svh bg-linear-to-br from-[#eaf1ff] via-[#e4edfd] to-[#d7e3fb] dark:from-[#0a1326] dark:via-[#0b1730] dark:to-[#091022]">
            <div className="animate-blob pointer-events-none fixed -top-24 -right-28 h-80 w-80 rounded-full bg-brand-blue/15 blur-3xl" />
            <div className="animate-blob pointer-events-none fixed -bottom-28 -left-24 h-80 w-80 rounded-full bg-brand-orange/10 blur-3xl [animation-delay:-8s]" />
            <div className="bg-dot-grid-blue pointer-events-none fixed inset-0 opacity-70" />

            <header className="relative z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/90">
                <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
                    <Link href={home()} className="inline-flex items-center">
                        <img
                            src="/vamospe-01.png"
                            alt="VanPe"
                            className="h-9 w-auto object-contain"
                        />
                    </Link>
                    <div className="flex items-center gap-0.5">
                        <AppearanceToggle />
                        <LanguageToggle />
                    </div>
                </div>
            </header>

            <main className="relative z-10 mx-auto max-w-4xl px-6 py-10 sm:py-14">
                <nav
                    aria-label={t('legal.nav.aria')}
                    className="mb-8 flex flex-wrap gap-2"
                >
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={
                                item.active
                                    ? 'rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-blue/25'
                                    : 'rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-brand-blue dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600 dark:hover:text-brand-blue-light'
                            }
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <article className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-brand-blue/8 sm:p-10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
                    {children}
                </article>

                <footer className="mt-10 space-y-2 text-center text-xs text-slate-600 dark:text-slate-400">
                    <p>{t('legal.footer.contact')}</p>
                    <p>
                        {t('legal.footer.rights', {
                            year: String(new Date().getFullYear()),
                        })}
                    </p>
                </footer>
            </main>
        </div>
    );
}
