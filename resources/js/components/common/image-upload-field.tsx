import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageLightbox } from '@/components/common/image-lightbox';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type ImageUploadFieldProps = {
    value: File | null;
    existingUrl: string | null;
    removed: boolean;
    onFileChange: (file: File | null) => void;
    onRemove: () => void;
    disabled?: boolean;
    error?: string;
    dropzoneClassName?: string;
    layout?: 'default' | 'compact';
    previewAspect?: 'square' | 'video';
};

export function ImageUploadField({
    value,
    existingUrl,
    removed,
    onFileChange,
    onRemove,
    disabled = false,
    error,
    dropzoneClassName,
    layout = 'default',
    previewAspect = 'square',
}: ImageUploadFieldProps) {
    const { t } = useTranslations();
    const inputRef = useRef<HTMLInputElement>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const previewUrl = useMemo(() => {
        if (value) {
            return URL.createObjectURL(value);
        }
        if (!removed && existingUrl) {
            return existingUrl;
        }
        return null;
    }, [value, existingUrl, removed]);

    useEffect(() => {
        return () => {
            if (value && previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [value, previewUrl]);

    const previewImageClass = cn(
        'rounded-lg bg-muted/30 object-contain',
        layout === 'compact' &&
            previewAspect === 'square' &&
            'size-28 sm:size-32',
        layout === 'compact' &&
            previewAspect === 'video' &&
            'h-24 w-40 sm:h-28 sm:w-48',
        layout === 'default' &&
            'max-h-44 w-full flex-1 sm:max-h-none',
    );

    const previewBlock = previewUrl ? (
        <button
            type="button"
            disabled={disabled}
            onClick={() => setLightboxOpen(true)}
            className={cn(
                'shrink-0 overflow-hidden rounded-lg ring-offset-background transition-opacity',
                !disabled && 'cursor-pointer hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                disabled && 'cursor-default',
            )}
            title={t('configuracion.image_preview_expand')}
        >
            <img src={previewUrl} alt="" className={previewImageClass} />
        </button>
    ) : null;

    const actionButtons = !disabled && previewUrl && (
        <div className="flex flex-wrap gap-2">
            <Button
                type="button"
                size="sm"
                variant="outline"
                className="cursor-pointer"
                onClick={() => inputRef.current?.click()}
            >
                {t('carta.image_change')}
            </Button>
            <Button
                type="button"
                size="sm"
                variant="ghost"
                className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={onRemove}
            >
                <Trash2 className="size-3.5" />
                {t('carta.image_remove')}
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col gap-2">
            <div
                className={cn(
                    'relative overflow-hidden rounded-xl border border-dashed transition-colors',
                    previewUrl
                        ? 'border-orange-200 bg-orange-50/40'
                        : 'border-[#d0dbef] bg-muted/20',
                    error && 'border-destructive',
                    layout === 'default' &&
                        'flex min-h-[140px] flex-1 flex-col items-center justify-center gap-3 p-4',
                    layout === 'compact' && 'p-3',
                    dropzoneClassName,
                )}
            >
                {previewUrl ? (
                    layout === 'compact' ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {previewBlock}
                            {actionButtons}
                        </div>
                    ) : (
                        <>
                            <img
                                src={previewUrl}
                                alt=""
                                className={previewImageClass}
                            />
                            {actionButtons}
                        </>
                    )
                ) : (
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => inputRef.current?.click()}
                        className={cn(
                            'flex w-full flex-col items-center gap-2 rounded-lg px-4 py-6 text-center transition-colors',
                            !disabled &&
                                'cursor-pointer hover:bg-white/60',
                            disabled && 'cursor-default opacity-60',
                            layout === 'compact' && 'py-4',
                        )}
                    >
                        <span
                            className={cn(
                                'flex items-center justify-center rounded-full bg-orange-100 text-brand-orange',
                                layout === 'compact' ? 'size-10' : 'size-12',
                            )}
                        >
                            <ImagePlus
                                className={layout === 'compact' ? 'size-5' : 'size-6'}
                            />
                        </span>
                        <span className="text-sm font-medium text-foreground">
                            {t('carta.image_upload')}
                        </span>
                        <span className="text-[12px] text-muted-foreground">
                            {t('carta.image_hint')}
                        </span>
                    </button>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={disabled}
                    onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        onFileChange(file);
                        e.target.value = '';
                    }}
                />
            </div>

            {error && (
                <p className="text-[12px] text-destructive">{error}</p>
            )}

            <ImageLightbox
                src={previewUrl}
                open={lightboxOpen}
                onOpenChange={setLightboxOpen}
            />
        </div>
    );
}
