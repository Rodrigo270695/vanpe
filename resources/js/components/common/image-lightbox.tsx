import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';

type ImageLightboxProps = {
    src: string | null;
    alt?: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
};

export function ImageLightbox({
    src,
    alt = '',
    open,
    onOpenChange,
    title,
}: ImageLightboxProps) {
    if (!src) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[min(92vw,56rem)] gap-0 overflow-hidden p-2 sm:p-3">
                {title ? (
                    <DialogTitle className="sr-only">{title}</DialogTitle>
                ) : (
                    <DialogTitle className="sr-only">{alt || 'Imagen'}</DialogTitle>
                )}
                <DialogDescription className="sr-only">
                    Vista ampliada de la imagen
                </DialogDescription>
                <img
                    src={src}
                    alt={alt}
                    className="max-h-[85vh] w-full rounded-md object-contain"
                />
            </DialogContent>
        </Dialog>
    );
}
