import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';

type ConfigTabSaveFooterProps = {
    canManage: boolean;
    processing: boolean;
};

export function ConfigTabSaveFooter({
    canManage,
    processing,
}: ConfigTabSaveFooterProps) {
    const { t } = useTranslations();

    if (!canManage) {
        return null;
    }

    return (
        <div className="flex justify-end border-t border-border pt-4">
            <Button
                type="submit"
                disabled={processing}
                className="cursor-pointer gap-2"
            >
                <Save className="size-4" />
                {processing ? t('configuracion.saving') : t('configuracion.save')}
            </Button>
        </div>
    );
}
