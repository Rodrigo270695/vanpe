import { router, useForm } from '@inertiajs/react';
import { Camera, ImagePlus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ImageLightbox } from '@/components/common/image-lightbox';
import { ImageUploadField } from '@/components/common/image-upload-field';
import type { ConfigVenue, VenuePhotoRow } from '@/components/configuracion/types';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type VenueImagesSectionProps = {
    logoUrl: string | null;
    portadaUrl: string | null;
    venue: ConfigVenue;
    canManage: boolean;
};

export function VenueImagesSection({
    logoUrl,
    portadaUrl,
    venue,
    canManage,
}: VenueImagesSectionProps) {
    const { t } = useTranslations();
    const [existingLogoUrl, setExistingLogoUrl] = useState(logoUrl);
    const [existingPortadaUrl, setExistingPortadaUrl] = useState(portadaUrl);
    const [galleryUploadOpen, setGalleryUploadOpen] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [lightboxAlt, setLightboxAlt] = useState('');

    useEffect(() => {
        setExistingLogoUrl(logoUrl);
        setExistingPortadaUrl(portadaUrl);
    }, [logoUrl, portadaUrl]);

    const brandedForm = useForm({
        logo: null as File | null,
        portada: null as File | null,
        remove_logo: false,
        remove_portada: false,
    });

    const galleryForm = useForm({
        image: null as File | null,
        caption: '',
    });

    const galleryPreviewUrl = useMemo(() => {
        if (!galleryForm.data.image) {
            return null;
        }

        return URL.createObjectURL(galleryForm.data.image);
    }, [galleryForm.data.image]);

    useEffect(() => {
        return () => {
            if (galleryPreviewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(galleryPreviewUrl);
            }
        };
    }, [galleryPreviewUrl]);

    const canSaveBranded = useMemo(
        () =>
            brandedForm.data.logo !== null ||
            brandedForm.data.portada !== null ||
            brandedForm.data.remove_logo ||
            brandedForm.data.remove_portada,
        [brandedForm.data],
    );

    const saveBranded = () => {
        brandedForm.post('/configuracion/venue-images', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => brandedForm.reset(),
        });
    };

    const addGalleryPhoto = () => {
        if (!galleryForm.data.image) {
            return;
        }

        galleryForm.post('/configuracion/venue-photos', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                galleryForm.reset();
                setGalleryUploadOpen(false);
            },
        });
    };

    const closeGalleryUpload = (open: boolean) => {
        if (!open) {
            galleryForm.reset();
        }

        setGalleryUploadOpen(open);
    };

    const removePhoto = (photo: VenuePhotoRow) => {
        if (!confirm(t('configuracion.venue_photo_delete_confirm'))) {
            return;
        }

        router.delete(`/configuracion/venue-photos/${photo.id}`, {
            preserveScroll: true,
        });
    };

    const openGalleryLightbox = (src: string, alt = '') => {
        setLightboxSrc(src);
        setLightboxAlt(alt);
    };

    const atGalleryLimit = venue.photos.length >= venue.max_photos;

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">
                        {t('configuracion.field_logo')}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                        {t('configuracion.field_logo_hint')}
                    </p>
                    <ImageUploadField
                        value={brandedForm.data.logo}
                        existingUrl={existingLogoUrl}
                        removed={brandedForm.data.remove_logo}
                        onFileChange={(file) => {
                            brandedForm.setData({
                                ...brandedForm.data,
                                logo: file,
                                remove_logo: false,
                            });
                        }}
                        onRemove={() => {
                            brandedForm.setData({
                                ...brandedForm.data,
                                logo: null,
                                remove_logo: true,
                            });
                        }}
                        disabled={!canManage}
                        error={brandedForm.errors.logo}
                        layout="compact"
                        previewAspect="square"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">
                        {t('configuracion.field_portada')}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                        {t('configuracion.field_portada_hint')}
                    </p>
                    <ImageUploadField
                        value={brandedForm.data.portada}
                        existingUrl={existingPortadaUrl}
                        removed={brandedForm.data.remove_portada}
                        onFileChange={(file) => {
                            brandedForm.setData({
                                ...brandedForm.data,
                                portada: file,
                                remove_portada: false,
                            });
                        }}
                        onRemove={() => {
                            brandedForm.setData({
                                ...brandedForm.data,
                                portada: null,
                                remove_portada: true,
                            });
                        }}
                        disabled={!canManage}
                        error={brandedForm.errors.portada}
                        layout="compact"
                        previewAspect="video"
                    />
                </div>
            </div>

            {canManage && (
                <div className="flex justify-end">
                    <Button
                        type="button"
                        disabled={!canSaveBranded || brandedForm.processing}
                        onClick={saveBranded}
                        className="cursor-pointer gap-2"
                    >
                        <Save className="size-4" />
                        {brandedForm.processing
                            ? t('configuracion.saving')
                            : t('configuracion.venue_images_save')}
                    </Button>
                </div>
            )}

            <div className="border-t border-border/60 pt-5">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h3 className="text-sm font-semibold">
                            {t('configuracion.field_gallery')}
                        </h3>
                        <p className="text-[12px] text-muted-foreground">
                            {t('configuracion.field_gallery_hint', {
                                max: venue.max_photos,
                            })}
                        </p>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {venue.photos.length}/{venue.max_photos}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {venue.photos.map((photo) => (
                        <div
                            key={photo.id}
                            className="group relative overflow-hidden rounded-xl border border-[#d0dbef] bg-muted/20"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    openGalleryLightbox(
                                        photo.image_url,
                                        photo.caption ?? '',
                                    )
                                }
                                className="block w-full cursor-pointer"
                                title={t('configuracion.image_preview_expand')}
                            >
                                <img
                                    src={photo.image_url}
                                    alt={photo.caption ?? ''}
                                    className="aspect-[4/3] w-full object-cover transition-opacity group-hover:opacity-90"
                                />
                            </button>
                            {photo.caption ? (
                                <p className="truncate px-2 py-1.5 text-[11px] text-muted-foreground">
                                    {photo.caption}
                                </p>
                            ) : null}
                            {canManage && (
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="destructive"
                                    className="absolute top-2 right-2 size-8 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={() => removePhoto(photo)}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            )}
                        </div>
                    ))}

                    {canManage && !atGalleryLimit && (
                        <label
                            className={cn(
                                'flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d0dbef] bg-muted/10 p-3 transition-colors hover:border-brand-blue/40 hover:bg-muted/20',
                            )}
                        >
                            <span className="flex size-10 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                                <ImagePlus className="size-5" />
                            </span>
                            <span className="text-center text-[12px] font-medium text-brand-blue dark:text-brand-blue-light">
                                {t('configuracion.venue_gallery_add')}
                            </span>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="sr-only"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    if (file) {
                                        galleryForm.setData({
                                            image: file,
                                            caption: '',
                                        });
                                        setGalleryUploadOpen(true);
                                    }
                                    e.target.value = '';
                                }}
                            />
                        </label>
                    )}
                </div>
            </div>

            <Dialog open={galleryUploadOpen} onOpenChange={closeGalleryUpload}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {t('configuracion.venue_gallery_upload')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('configuracion.venue_gallery_upload_hint')}
                        </DialogDescription>
                    </DialogHeader>

                    {galleryPreviewUrl && (
                        <button
                            type="button"
                            onClick={() => openGalleryLightbox(galleryPreviewUrl)}
                            className="mx-auto block max-w-full cursor-pointer overflow-hidden rounded-lg bg-muted/30"
                            title={t('configuracion.image_preview_expand')}
                        >
                            <img
                                src={galleryPreviewUrl}
                                alt=""
                                className="max-h-48 w-full object-contain"
                            />
                        </button>
                    )}

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">
                            {t('configuracion.venue_photo_caption')}
                        </label>
                        <Input
                            value={galleryForm.data.caption}
                            onChange={(e) =>
                                galleryForm.setData('caption', e.target.value)
                            }
                            placeholder={t(
                                'configuracion.venue_photo_caption_placeholder',
                            )}
                            className="bg-card"
                        />
                        {galleryForm.errors.image && (
                            <p className="mt-1 text-[12px] text-destructive">
                                {galleryForm.errors.image}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => closeGalleryUpload(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            disabled={galleryForm.processing}
                            onClick={addGalleryPhoto}
                            className="cursor-pointer gap-2"
                        >
                            <Camera className="size-4" />
                            {galleryForm.processing
                                ? t('configuracion.saving')
                                : t('configuracion.venue_gallery_upload')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ImageLightbox
                src={lightboxSrc}
                alt={lightboxAlt}
                open={lightboxSrc !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setLightboxSrc(null);
                        setLightboxAlt('');
                    }
                }}
                title={lightboxAlt}
            />
        </div>
    );
}
