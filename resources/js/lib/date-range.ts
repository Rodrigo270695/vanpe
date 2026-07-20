export type DateRangePreset =
    | 'this_month'
    | 'previous_month'
    | 'last_7_days'
    | 'last_30_days'
    | 'this_quarter'
    | 'this_year'
    | 'custom';

export type DateRange = {
    from: string;
    to: string;
};

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
    'this_month',
    'previous_month',
    'last_7_days',
    'last_30_days',
    'this_quarter',
    'this_year',
    'custom',
];

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

export function toIsoDate(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIsoDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function formatDisplayDate(
    iso: string,
    locale: string = 'es-PE',
): string {
    return parseIsoDate(iso).toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

export function getPresetRange(
    preset: DateRangePreset,
    reference: Date = new Date(),
): DateRange {
    const today = new Date(
        reference.getFullYear(),
        reference.getMonth(),
        reference.getDate(),
    );

    switch (preset) {
        case 'this_month':
            return {
                from: toIsoDate(startOfMonth(today)),
                to: toIsoDate(endOfMonth(today)),
            };
        case 'previous_month': {
            const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            return {
                from: toIsoDate(startOfMonth(prev)),
                to: toIsoDate(endOfMonth(prev)),
            };
        }
        case 'last_7_days':
            return {
                from: toIsoDate(addDays(today, -6)),
                to: toIsoDate(today),
            };
        case 'last_30_days':
            return {
                from: toIsoDate(addDays(today, -29)),
                to: toIsoDate(today),
            };
        case 'this_quarter': {
            const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
            const start = new Date(today.getFullYear(), quarterMonth, 1);
            return {
                from: toIsoDate(start),
                to: toIsoDate(today),
            };
        }
        case 'this_year':
            return {
                from: toIsoDate(new Date(today.getFullYear(), 0, 1)),
                to: toIsoDate(today),
            };
        default:
            return { from: toIsoDate(today), to: toIsoDate(today) };
    }
}

export function detectPreset(range: DateRange): DateRangePreset {
    for (const preset of DATE_RANGE_PRESETS) {
        if (preset === 'custom') continue;
        const expected = getPresetRange(preset);
        if (expected.from === range.from && expected.to === range.to) {
            return preset;
        }
    }

    return 'custom';
}

export function todayRange(): DateRange {
    const today = toIsoDate(new Date());
    return { from: today, to: today };
}

export function rangeTriggerLabel(
    range: DateRange,
    preset: DateRangePreset,
    locale: string,
): string {
    if (preset === 'this_month') {
        const date = parseIsoDate(range.from);
        const month = date.toLocaleDateString(locale, {
            month: 'short',
            year: 'numeric',
        });
        return month.charAt(0).toUpperCase() + month.slice(1);
    }

    if (preset === 'this_year') {
        return String(parseIsoDate(range.from).getFullYear());
    }

    if (range.from === range.to) {
        return formatDisplayDate(range.from, locale);
    }

    return `${formatDisplayDate(range.from, locale)} – ${formatDisplayDate(range.to, locale)}`;
}
