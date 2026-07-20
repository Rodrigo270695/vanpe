/** Colores de acento por plan (fallback si no hay color_hex en BD). */
export const PLAN_ACCENT_COLORS: Record<string, string> = {
    free: '#94a3b8',
    starter: '#4a7ab8',
    pro: '#0744a9',
    premium: '#2d4a73',
};

const DEFAULT_PLAN_COLOR = '#0744a9';

export function resolvePlanColor(
    code: string,
    colorHex: string | null | undefined,
): string {
    if (colorHex && /^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
        return colorHex;
    }

    return PLAN_ACCENT_COLORS[code] ?? DEFAULT_PLAN_COLOR;
}
