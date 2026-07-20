export type ThermalRollWidth = 56 | 58 | 80;

const STORAGE_KEY = 'vanpe_thermal_roll_mm';

export const THERMAL_WIDTHS: ThermalRollWidth[] = [56, 58, 80];

export function getThermalRollWidth(): ThermalRollWidth {
    if (typeof window === 'undefined') {
        return 80;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === '56' || stored === '58' || stored === '80') {
        return Number(stored) as ThermalRollWidth;
    }

    return 80;
}

export function setThermalRollWidth(width: ThermalRollWidth): void {
    window.localStorage.setItem(STORAGE_KEY, String(width));
}

export function thermalWidthClass(width: ThermalRollWidth): string {
    return width === 56 ? 'w-[56mm]' : width === 58 ? 'w-[58mm]' : 'w-[80mm]';
}

export function printSaleTicket(): void {
    window.print();
}
