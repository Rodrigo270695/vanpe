import type { StatusPillVariant } from '@/components/common/status-pill';

export type MesaTableStatus = 'free' | 'occupied' | 'reserved' | 'inactive';

export type MesaStatusStyle = {
    pill: StatusPillVariant;
    card: string;
    numberBadge: string;
    dot: string;
};

const styles: Record<MesaTableStatus, MesaStatusStyle> = {
    free: {
        pill: 'green',
        card: 'border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 shadow-sm shadow-emerald-100/50 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100/60',
        numberBadge:
            'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80',
        dot: 'bg-emerald-500',
    },
    occupied: {
        pill: 'amber',
        card: 'border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 shadow-sm shadow-amber-100/50 hover:border-amber-300 hover:shadow-md hover:shadow-amber-100/60',
        numberBadge:
            'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80',
        dot: 'bg-amber-500',
    },
    reserved: {
        pill: 'violet',
        card: 'border-violet-200/90 bg-gradient-to-br from-violet-50/90 via-white to-purple-50/40 shadow-sm shadow-violet-100/50 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100/60',
        numberBadge:
            'bg-violet-100 text-violet-800 ring-1 ring-violet-200/80',
        dot: 'bg-violet-500',
    },
    inactive: {
        pill: 'muted',
        card: 'border-slate-200/90 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/40 opacity-75 hover:opacity-90',
        numberBadge:
            'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
        dot: 'bg-slate-400',
    },
};

export function resolveMesaStatus(status: string): MesaTableStatus {
    if (status === 'free' || status === 'occupied' || status === 'reserved') {
        return status;
    }
    return 'inactive';
}

export function mesaStatusStyle(status: string): MesaStatusStyle {
    return styles[resolveMesaStatus(status)];
}
