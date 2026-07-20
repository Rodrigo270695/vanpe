import { router, usePage } from '@inertiajs/react';
import { useCallback } from 'react';
import { update } from '@/routes/locale';

export type Locale = string;

type TranslationTree = Record<string, unknown>;

const resolveKey = (tree: TranslationTree, key: string): string | undefined => {
    const value = key
        .split('.')
        .reduce<unknown>(
            (acc, part) =>
                acc && typeof acc === 'object'
                    ? (acc as TranslationTree)[part]
                    : undefined,
            tree,
        );

    return typeof value === 'string' ? value : undefined;
};

export type UseTranslationsReturn = {
    readonly locale: Locale;
    readonly timezone: string;
    readonly availableLocales: Locale[];
    readonly setLocale: (locale: Locale) => void;
    readonly t: (key: string, replacements?: Record<string, string | number>) => string;
};

/**
 * Hook de internacionalización para Inertia + React.
 *
 * Uso:
 *   const { t, locale, setLocale } = useTranslations();
 *   t('nav.dashboard');
 *   t('welcome.subtitle', { name: 'Ana' });
 */
export function useTranslations(): UseTranslationsReturn {
    const { locale, timezone, availableLocales, translations } = usePage().props;

    const t = useCallback(
        (key: string, replacements?: Record<string, string | number>): string => {
            let value =
                resolveKey(translations as TranslationTree, key) ?? key;

            if (replacements) {
                for (const [token, replacement] of Object.entries(replacements)) {
                    value = value.replace(`:${token}`, String(replacement));
                }
            }

            return value;
        },
        [translations],
    );

    const setLocale = useCallback(
        (next: Locale): void => {
            if (next === locale) {
                return;
            }

            // Persistimos el idioma en el servidor (cookie) y recargamos la vista.
            router.post(
                update.url({ locale: next }),
                {},
                {
                    preserveScroll: true,
                    preserveState: false,
                },
            );
        },
        [locale],
    );

    return {
        locale,
        timezone: typeof timezone === 'string' ? timezone : 'America/Lima',
        availableLocales: availableLocales as Locale[],
        setLocale,
        t,
    } as const;
}
