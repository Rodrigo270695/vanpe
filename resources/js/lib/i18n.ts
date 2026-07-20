export type TranslationTree = Record<string, unknown>;

export const SUPPORTED_LOCALES = ['es', 'en'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<
    SupportedLocale,
    { native: string; flag: string }
> = {
    es: { native: 'Español', flag: '🇪🇸' },
    en: { native: 'English', flag: '🇬🇧' },
};

/** Resuelve una clave de traducción desde el árbol compartido por Inertia. */
export function translate(
    tree: TranslationTree,
    key: string,
    fallback?: string,
): string {
    const value = key
        .split('.')
        .reduce<unknown>(
            (acc, part) =>
                acc && typeof acc === 'object'
                    ? (acc as TranslationTree)[part]
                    : undefined,
            tree,
        );

    return typeof value === 'string' ? value : (fallback ?? key);
}

import { DEFAULT_TIMEZONE, resolveLocaleTag } from '@/lib/datetime';

/** Formatea una fecha según el locale y la zona horaria de la app. */
export function formatLocaleDate(
    value: string | null,
    locale: string,
    timezone: string = DEFAULT_TIMEZONE,
): string {
    if (!value) {
        return '—';
    }

    return new Intl.DateTimeFormat(resolveLocaleTag(locale), {
        timeZone: timezone,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}
