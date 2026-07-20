import { useForm } from '@inertiajs/react';
import { UtensilsCrossed } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { FormField } from '@/components/common/form-field';
import { ImageUploadField } from '@/components/common/image-upload-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { CategoryRow, DishRow } from '@/components/carta/types';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type DishFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dish: DishRow | null;
    categories: CategoryRow[];
    defaultCategoryId?: string;
};

function buildEmptyDishForm(categoryId = '') {
    return {
        category_id: categoryId,
        name: '',
        description: '',
        price: '',
        image: null as File | null,
        remove_image: false,
        available: true,
        publish_in_app: false,
        featured: false,
    };
}

function isDishFormComplete(
    data: ReturnType<typeof buildEmptyDishForm>,
    lockedCategoryId: string | null,
): boolean {
    const categoryId = lockedCategoryId ?? data.category_id;
    if (!categoryId) {
        return false;
    }

    if (!data.name.trim()) {
        return false;
    }

    const priceText = data.price.trim();
    if (priceText === '') {
        return false;
    }

    const price = Number(priceText);

    return !Number.isNaN(price) && price >= 0;
}

export function DishFormModal({
    open,
    onOpenChange,
    dish,
    categories,
    defaultCategoryId,
}: DishFormModalProps) {
    const { t } = useTranslations();
    const isEditing = dish !== null;
    const lockedCategoryId =
        !isEditing && defaultCategoryId ? defaultCategoryId : null;
    const lockedCategory = useMemo(
        () =>
            lockedCategoryId
                ? categories.find((category) => category.id === lockedCategoryId)
                : null,
        [categories, lockedCategoryId],
    );
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
        null,
    );
    const [formKey, setFormKey] = useState(0);

    const {
        data,
        setData,
        post,
        transform,
        processing,
        errors,
        reset,
        setDefaults,
        clearErrors,
        setError,
    } = useForm(buildEmptyDishForm());

    const selectedCategory = useMemo(
        () =>
            categories.find(
                (category) =>
                    category.id === (lockedCategoryId ?? data.category_id),
            ),
        [categories, data.category_id, lockedCategoryId],
    );

    const isMenuCategory = selectedCategory?.menu_role === 'menu';

    const inputClass = (fieldError?: string) =>
        cn(
            'bg-card',
            fieldError &&
                'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30',
        );

    const validateClient = (): boolean => {
        clearErrors();

        let valid = true;
        const categoryId = lockedCategoryId ?? data.category_id;

        if (!categoryId) {
            setError('category_id', t('carta.validation_category_required'));
            valid = false;
        }

        if (!data.name.trim()) {
            setError('name', t('carta.validation_name_required'));
            valid = false;
        }

        const priceText = data.price.trim();
        if (priceText === '') {
            setError('price', t('carta.validation_price_required'));
            valid = false;
        } else if (Number.isNaN(Number(priceText)) || Number(priceText) < 0) {
            setError('price', t('carta.validation_price_numeric'));
            valid = false;
        }

        return valid;
    };

    const resetForm = useCallback(
        (categoryId?: string) => {
            const resolvedCategoryId = categoryId ?? defaultCategoryId ?? '';
            const empty = buildEmptyDishForm(resolvedCategoryId);
            setDefaults(empty);
            reset();
            setData(empty);
            transform((payload) => payload);
            setExistingImageUrl(null);
            clearErrors();
            setFormKey((key) => key + 1);
        },
        [clearErrors, defaultCategoryId, reset, setData, setDefaults, transform],
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        if (dish) {
            setExistingImageUrl(dish.image_url);
            const editData = {
                category_id: dish.category_id,
                name: dish.name,
                description: dish.description ?? '',
                price: String(dish.price),
                image: null,
                remove_image: false,
                available: dish.available,
                publish_in_app: dish.publish_in_app,
                featured: dish.featured,
            };
            setDefaults(editData);
            setData(editData);
            setFormKey((key) => key + 1);
        } else {
            resetForm(defaultCategoryId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, dish, defaultCategoryId]);

    const canSubmit = useMemo(
        () => isDishFormComplete(data, lockedCategoryId),
        [data, lockedCategoryId],
    );

    const submit = () => {
        if (!validateClient()) {
            return;
        }

        const options = {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                onOpenChange(false);
                if (!isEditing) {
                    resetForm(defaultCategoryId);
                }
            },
        };

        if (isEditing) {
            transform((payload) => ({
                ...payload,
                _method: 'put',
            }));
            post(`/carta/dishes/${dish.id}`, options);
            return;
        }

        transform((payload) => payload);
        post('/carta/dishes', options);
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                isEditing
                    ? t('carta.edit_dish_title')
                    : lockedCategory
                      ? t('carta.create_dish_in_category', {
                            category: lockedCategory.name,
                        })
                      : t('carta.create_dish_title')
            }
            description={
                lockedCategory
                    ? t('carta.dish_form_hint_locked_category', {
                          category: lockedCategory.name,
                      })
                    : t('carta.dish_form_hint')
            }
            icon={UtensilsCrossed}
            submitLabel={
                isEditing
                    ? t('table.save_changes')
                    : t('carta.create_dish_submit')
            }
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={processing}
            contentClassName="sm:max-w-2xl"
            onAfterClose={() => resetForm()}
        >
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-4">
                    {lockedCategory ? (
                        <div
                            className={cn(
                                'rounded-xl border px-4 py-3',
                                errors.category_id
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-brand-blue/20 bg-brand-blue/5',
                            )}
                        >
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {t('carta.field_category')}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-foreground">
                                {lockedCategory.name}
                            </p>
                            {errors.category_id ? (
                                <p className="mt-2 text-sm text-red-600">
                                    {errors.category_id}
                                </p>
                            ) : null}
                        </div>
                    ) : (
                        <FormField
                            label={t('carta.field_category')}
                            required
                            error={errors.category_id}
                        >
                            <Select
                                value={data.category_id}
                                onValueChange={(v) =>
                                    setData('category_id', v)
                                }
                            >
                                <SelectTrigger
                                className={cn(
                                    'w-full bg-card',
                                    errors.category_id &&
                                        'border-red-500 focus-visible:ring-red-500/30',
                                )}
                            >
                                    <SelectValue
                                        placeholder={t('carta.select_category')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={category.id}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    )}

                    <FormField
                        label={t('carta.field_dish_name')}
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
                        label={t('carta.field_dish_description')}
                        error={errors.description}
                    >
                        <Input
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            className="bg-card"
                        />
                    </FormField>

                    <FormField
                        label={t('carta.field_price')}
                        required
                        error={errors.price}
                    >
                        <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
                                S/
                            </span>
                            <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={data.price}
                                onChange={(e) =>
                                    setData('price', e.target.value)
                                }
                                className={cn('pl-9 font-mono', inputClass(errors.price))}
                                aria-invalid={Boolean(errors.price)}
                            />
                        </div>
                    </FormField>
                </div>

                <FormField
                    label={t('carta.field_image')}
                    error={errors.image}
                    className="flex flex-col sm:min-h-[280px]"
                >
                    <ImageUploadField
                        key={formKey}
                        value={data.image}
                        existingUrl={existingImageUrl}
                        removed={data.remove_image}
                        dropzoneClassName="min-h-[220px]"
                        onFileChange={(file) => {
                            setData({
                                ...data,
                                image: file,
                                remove_image: false,
                            });
                        }}
                        onRemove={() => {
                            setData({
                                ...data,
                                image: null,
                                remove_image: true,
                            });
                        }}
                    />
                </FormField>

                {isMenuCategory ? (
                    <p className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 sm:col-span-2">
                        {t('carta.menu_dish_extras_hint')}
                    </p>
                ) : null}

                <label
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors sm:col-span-2',
                        data.available
                            ? 'border-emerald-300/60 bg-emerald-50/60'
                            : 'border-border bg-card',
                    )}
                >
                    <Checkbox
                        checked={data.available}
                        onCheckedChange={(v) => setData('available', v === true)}
                        className="mt-0.5"
                    />
                    <span className="block text-sm font-medium">
                        {t('carta.field_available')}
                    </span>
                </label>

                <label
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                        data.publish_in_app
                            ? 'border-brand-blue/30 bg-brand-blue/6'
                            : 'border-border bg-card',
                    )}
                >
                    <Checkbox
                        checked={data.publish_in_app}
                        onCheckedChange={(v) =>
                            setData('publish_in_app', v === true)
                        }
                        className="mt-0.5"
                    />
                    <span className="block text-sm font-medium">
                        {t('carta.field_publish_in_app')}
                    </span>
                </label>

                <label
                    className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                        data.featured
                            ? 'border-amber-300/60 bg-amber-50/60'
                            : 'border-border bg-card',
                    )}
                >
                    <Checkbox
                        checked={data.featured}
                        onCheckedChange={(v) => setData('featured', v === true)}
                        className="mt-0.5"
                    />
                    <span className="block text-sm font-medium">
                        {t('carta.field_featured')}
                    </span>
                </label>
            </div>
        </BaseModal>
    );
}
