export const DEFAULT_TIMEZONE = 'America/Lima';

export function resolveLocaleTag(locale: string): string {
    return locale.startsWith('en') ? 'en-US' : 'es-PE';
}

export function formatAppDateTime(
    iso: string | null,
    locale: string,
    timezone: string = DEFAULT_TIMEZONE,
    options?: Intl.DateTimeFormatOptions,
): string {
    if (!iso) {
        return '—';
    }

    return new Intl.DateTimeFormat(resolveLocaleTag(locale), {
        timeZone: timezone,
        ...options,
    }).format(new Date(iso));
}

export function formatAppDate(
    iso: string | null,
    locale: string,
    timezone: string = DEFAULT_TIMEZONE,
): string {
    return formatAppDateTime(iso, locale, timezone, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function formatAppTime(
    iso: string | null,
    locale: string,
    timezone: string = DEFAULT_TIMEZONE,
): string {
    return formatAppDateTime(iso, locale, timezone, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatAppTicketDateTime(
    iso: string | null,
    locale: string,
    timezone: string = DEFAULT_TIMEZONE,
): string {
    return formatAppDateTime(iso, locale, timezone, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function parseIsoTimestamp(iso: string | null | undefined): number | null {
    if (!iso) {
        return null;
    }

    const ms = Date.parse(iso);

    return Number.isNaN(ms) ? null : ms;
}

export function sortByIsoDateDesc(
    a: string | null | undefined,
    b: string | null | undefined,
): number {
    const ta = parseIsoTimestamp(a);
    const tb = parseIsoTimestamp(b);

    if (ta == null && tb == null) {
        return 0;
    }
    if (ta == null) {
        return 1;
    }
    if (tb == null) {
        return -1;
    }

    return tb - ta;
}
