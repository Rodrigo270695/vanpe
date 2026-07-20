import { useForm } from '@inertiajs/react';
import { Tags } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import type { CatalogItemRow } from '@/components/catalog/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslations } from '@/hooks/use-translations';

type CatalogItemFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: CatalogItemRow | null;
    types: string[];
    typeLabels: Record<string, string>;
    defaultType?: string;
};

export function CatalogItemFormModal({
    open,
    onOpenChange,
    item,
    types,
    typeLabels,
    defaultType,
}: CatalogItemFormModalProps) {
    const { t } = useTranslations();
    const isEditing = item !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            type: defaultType ?? 'cuisine',
            slug: '',
            name_es: '',
            name_en: '',
            icon: '',
            sort_order: '0',
            active: true,
        });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        if (item) {
            setData({
                type: item.type,
                slug: item.slug,
                name_es: item.name_es,
                name_en: item.name_en,
                icon: item.icon ?? '',
                sort_order: String(item.sort_order),
                active: item.active,
            });
        } else {
            reset();
            if (defaultType) setData('type', defaultType);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, item, defaultType]);

    const canSubmit = useMemo(
        () =>
            data.type !== '' &&
            data.slug.trim().length > 0 &&
            data.name_es.trim().length > 0 &&
            data.name_en.trim().length > 0,
        [data],
    );

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };
        if (isEditing) {
            put(`/catalogo/items/${item.id}`, options);
        } else {
            post('/catalogo/items', options);
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('catalog.edit_item_title')
                    : t('catalog.create_item_title')
            }
            description={t('catalog.item_form_hint')}
            icon={Tags}
            submitLabel={
                isEditing ? t('table.save_changes') : t('catalog.create_item_submit')
            }
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={processing}
            onAfterClose={() => {
                reset();
                clearErrors();
            }}
            contentClassName="sm:max-w-lg"
        >
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                    label={t('catalog.field_type')}
                    required
                    error={errors.type}
                >
                    <Select
                        value={data.type}
                        onValueChange={(v) => setData('type', v)}
                    >
                        <SelectTrigger className="bg-card">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {types.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {typeLabels[type] ?? type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormField>

                <FormField label={t('catalog.field_slug')} required error={errors.slug}>
                    <Input
                        value={data.slug}
                        onChange={(e) => setData('slug', e.target.value)}
                        className="bg-card font-mono text-sm"
                    />
                </FormField>

                <FormField
                    label={t('catalog.field_name_es')}
                    required
                    error={errors.name_es}
                >
                    <Input
                        value={data.name_es}
                        onChange={(e) => setData('name_es', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField
                    label={t('catalog.field_name_en')}
                    required
                    error={errors.name_en}
                >
                    <Input
                        value={data.name_en}
                        onChange={(e) => setData('name_en', e.target.value)}
                        className="bg-card"
                    />
                </FormField>

                <FormField label={t('catalog.field_sort')} error={errors.sort_order}>
                    <Input
                        type="number"
                        min={0}
                        value={data.sort_order}
                        onChange={(e) => setData('sort_order', e.target.value)}
                        className="bg-card font-mono"
                    />
                </FormField>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3">
                    <Checkbox
                        checked={data.active}
                        onCheckedChange={(v) => setData('active', v === true)}
                    />
                    <span className="text-sm font-medium">{t('catalog.field_active')}</span>
                </label>
            </div>
        </BaseModal>
    );
}
