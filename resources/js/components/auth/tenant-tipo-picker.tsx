import { BedDouble, MapPin, Store } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

export type TenantTipo = 'restaurant' | 'tour_spot' | 'hotel';

type TipoOption = {
    value: TenantTipo;
    labelKey: string;
    nameKey: string;
    placeholderKey: string;
    icon: LucideIcon;
};

export const TENANT_TIPO_OPTIONS: TipoOption[] = [
    {
        value: 'restaurant',
        labelKey: 'auth.type_restaurant',
        nameKey: 'auth.business_name',
        placeholderKey: 'auth.business_name_placeholder',
        icon: Store,
    },
    {
        value: 'tour_spot',
        labelKey: 'auth.type_tour_spot',
        nameKey: 'auth.tour_spot_name',
        placeholderKey: 'auth.tour_spot_name_placeholder',
        icon: MapPin,
    },
    {
        value: 'hotel',
        labelKey: 'auth.type_hotel',
        nameKey: 'auth.hotel_name',
        placeholderKey: 'auth.hotel_name_placeholder',
        icon: BedDouble,
    },
];

export function tenantTipoOption(tipo: TenantTipo): TipoOption {
    return (
        TENANT_TIPO_OPTIONS.find((option) => option.value === tipo) ??
        TENANT_TIPO_OPTIONS[0]
    );
}

type Props = {
    value: TenantTipo;
    onChange: (value: TenantTipo) => void;
    error?: string;
};

export function TenantTipoPicker({ value, onChange, error }: Props) {
    const { t } = useTranslations();

    return (
        <div className="grid gap-2">
            <input type="hidden" name="tipo" value={value} />
            <Label className="text-white">{t('auth.account_type')}</Label>
            <div className="grid grid-cols-3 gap-2">
                {TENANT_TIPO_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        aria-pressed={value === option.value}
                        className={cn(
                            'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center ring-1 transition',
                            value === option.value
                                ? 'bg-white text-brand-blue ring-white'
                                : 'bg-white/10 text-white ring-white/25 hover:bg-white/15',
                        )}
                    >
                        <option.icon className="size-5" />
                        <span className="text-xs leading-tight font-bold">
                            {t(option.labelKey)}
                        </span>
                    </button>
                ))}
            </div>
            <InputError message={error} />
        </div>
    );
}
