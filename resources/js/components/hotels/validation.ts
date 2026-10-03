const RUC_PREFIXES = ['10', '15', '16', '17', '20'];
const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export const PERU_BOUNDS = {
    latMin: -18.6,
    latMax: 0.2,
    lngMin: -81.5,
    lngMax: -68.5,
};

export function onlyDigits(value: string, maxLength: number): string {
    return value.replace(/\D/g, '').slice(0, maxLength);
}

/** Acepta solo números con hasta 2 decimales. */
export function sanitizePrice(value: string): string {
    const cleaned = value.replace(',', '.').replace(/[^\d.]/g, '');
    const [integer, ...rest] = cleaned.split('.');

    if (rest.length === 0) {
        return integer.slice(0, 5);
    }

    return `${integer.slice(0, 5)}.${rest.join('').slice(0, 2)}`;
}

export function rucHasValidCheckDigit(ruc: string): boolean {
    const sum = RUC_WEIGHTS.reduce(
        (acc, weight, i) => acc + Number(ruc[i]) * weight,
        0,
    );
    let check = 11 - (sum % 11);

    if (check === 10) {
        check = 0;
    } else if (check === 11) {
        check = 1;
    }

    return check === Number(ruc[10]);
}

/** Devuelve la clave de traducción del error o null si es válido. */
export function rucErrorKey(ruc: string): string | null {
    if (!/^\d{11}$/.test(ruc)) {
        return 'validation_pe.ruc_digits';
    }

    if (!RUC_PREFIXES.includes(ruc.slice(0, 2))) {
        return 'validation_pe.ruc_prefix';
    }

    if (!rucHasValidCheckDigit(ruc)) {
        return 'validation_pe.ruc_check_digit';
    }

    return null;
}

export function phoneErrorKey(phone: string): string | null {
    if (!/^\d+$/.test(phone)) {
        return 'validation_pe.phone_digits';
    }

    if (phone.length !== 9) {
        return 'validation_pe.phone_length';
    }

    if (!phone.startsWith('9')) {
        return 'validation_pe.phone_prefix';
    }

    return null;
}

export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidWebsite(website: string): boolean {
    const value = /^https?:\/\//i.test(website) ? website : `https://${website}`;

    try {
        const url = new URL(value);

        return /\.[a-z]{2,}$/i.test(url.hostname);
    } catch {
        return false;
    }
}

export function isInsidePeru(lat: number, lng: number): boolean {
    return (
        lat >= PERU_BOUNDS.latMin &&
        lat <= PERU_BOUNDS.latMax &&
        lng >= PERU_BOUNDS.lngMin &&
        lng <= PERU_BOUNDS.lngMax
    );
}
