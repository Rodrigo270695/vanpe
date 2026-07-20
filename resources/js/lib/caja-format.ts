import {
    DEFAULT_TIMEZONE,
    formatAppDate,
    formatAppTicketDateTime,
    formatAppTime,
} from '@/lib/datetime';

export function formatCajaMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: currency === 'PEN' ? 'PEN' : currency,
        minimumFractionDigits: 2,
    }).format(amount);
}

export function formatCajaDate(
    iso: string | null,
    locale = 'es',
    timezone = DEFAULT_TIMEZONE,
): string {
    return formatAppDate(iso, locale, timezone);
}

export function formatCajaTime(
    iso: string | null,
    locale = 'es',
    timezone = DEFAULT_TIMEZONE,
): string {
    return formatAppTime(iso, locale, timezone);
}

export function formatCajaDateTime(
    iso: string | null,
    locale = 'es',
    timezone = DEFAULT_TIMEZONE,
): string {
    return formatAppTicketDateTime(iso, locale, timezone);
}
