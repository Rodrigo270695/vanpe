import { useForm } from '@inertiajs/react';
import { LayoutGrid } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { AreaRow } from '@/components/mesas/types';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type AreaFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    area: AreaRow | null;
};

export function AreaFormModal({ open, onOpenChange, area }: AreaFormModalProps) {
    const { t } = useTranslations();
    const isEditing = area !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            description: '',
            sort_order: '',
            active: true,
        });

    useEffect(() => {
        if (open && area) {
            setData({
                name: area.name,
                description: area.description ?? '',
                sort_order: String(area.sort_order),
                active: area.active,
            });
        }
        if (open && !area) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, area]);

    const canSubmit = useMemo(
        () => data.name.trim().length > 0,
        [data.name],
    );

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/mesas/areas/${area.id}`, options);
        } else {
            post('/mesas/areas', options);
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing ? t('mesas.edit_area_title') : t('mesas.create_area_title')
            }
            description={t('mesas.area_form_hint')}
            icon={LayoutGrid}
            submitLabel={
                isEditing ? t('table.save_changes') : t('mesas.create_area_submit')
            }
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={processing}
            onAfterClose={() => {
                reset();
                clearErrors();
            }}
        >
            <div className="grid gap-4">
                <FormField label={t('mesas.field_area_name')} required error={errors.name}>
                    <Input
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField label={t('mesas.field_area_description')} error={errors.description}>
                    <Input
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <label
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                        data.active
                            ? 'border-brand-blue/30 bg-brand-blue/[0.06]'
                            : 'border-border bg-card',
                    )}
                >
                    <Checkbox
                        checked={data.active}
                        onCheckedChange={(v) => setData('active', v === true)}
                        className="mt-0.5"
                    />
                    <span className="block text-sm font-medium">
                        {t('mesas.field_area_active')}
                    </span>
                </label>
            </div>
        </BaseModal>
    );
}
