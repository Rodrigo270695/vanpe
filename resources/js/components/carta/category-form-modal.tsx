import { useForm } from '@inertiajs/react';
import { LayoutGrid } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { CategoryRow } from '@/components/carta/types';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type CategoryFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: CategoryRow | null;
};

export function CategoryFormModal({
    open,
    onOpenChange,
    category,
}: CategoryFormModalProps) {
    const { t } = useTranslations();
    const isEditing = category !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors, setError } =
        useForm({
            name: '',
            description: '',
            sort_order: '',
            active: true,
        });

    useEffect(() => {
        if (open && category) {
            setData({
                name: category.name,
                description: category.description ?? '',
                sort_order: String(category.sort_order),
                active: category.active,
            });
        }
        if (open && !category) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, category]);

    const canSubmit = useMemo(
        () => data.name.trim().length > 0,
        [data.name],
    );

    const inputClass = (fieldError?: string) =>
        cn(
            'bg-card',
            fieldError &&
                'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30',
        );

    const submit = () => {
        clearErrors();

        if (!data.name.trim()) {
            setError('name', t('carta.validation_category_name_required'));
            return;
        }

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/carta/categories/${category.id}`, options);
        } else {
            post('/carta/categories', options);
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('carta.edit_category_title')
                    : t('carta.create_category_title')
            }
            description={t('carta.category_form_hint')}
            icon={LayoutGrid}
            submitLabel={
                isEditing
                    ? t('table.save_changes')
                    : t('carta.create_category_submit')
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
                <FormField
                    label={t('carta.field_category_name')}
                    required
                    error={errors.name}
                >
                    <Input
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={inputClass(errors.name)}
                        aria-invalid={Boolean(errors.name)}
                    />
                </FormField>

                <FormField
                    label={t('carta.field_category_description')}
                    error={errors.description}
                >
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
                            ? 'border-brand-blue/30 bg-brand-blue/6'
                            : 'border-border bg-card',
                    )}
                >
                    <Checkbox
                        checked={data.active}
                        onCheckedChange={(v) => setData('active', v === true)}
                        className="mt-0.5"
                    />
                    <span className="block text-sm font-medium">
                        {t('carta.field_category_active')}
                    </span>
                </label>
            </div>
        </BaseModal>
    );
}
