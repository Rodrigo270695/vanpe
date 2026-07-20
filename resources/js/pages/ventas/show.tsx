import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Ban, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { FelDocumentDownloadMenu } from '@/components/fel/fel-document-download-menu';
import { PostSaleDocumentModal } from '@/components/fel/post-sale-document-modal';
import { VoidSaleModal } from '@/components/ventas/void-sale-modal';
import type { SaleTicket } from '@/components/ventas/types';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { translate, type TranslationTree } from '@/lib/i18n';

type VentasShowProps = {
    ticket: SaleTicket;
    can: { void: boolean; emit_fel: boolean };
};

export default function VentasShow({ ticket, can }: VentasShowProps) {
    const { t } = useTranslations();
    const [open, setOpen] = useState(true);
    const [voidOpen, setVoidOpen] = useState(false);

    const emitFel = () => {
        router.post(`/ventas/${ticket.id}/emitir-fel`, {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('ventas.ticket_modal_title')} />

            <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-6">
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-fit gap-2"
                >
                    <Link href="/ventas">
                        <ArrowLeft className="size-4" />
                        {t('ventas.back_to_list')}
                    </Link>
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                    {ticket.fel?.estado === 'emitido' ? (
                        <FelDocumentDownloadMenu
                            document={ticket.fel}
                            saleId={ticket.id}
                            showViewCpe={false}
                        />
                    ) : null}
                    {can.emit_fel ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={emitFel}
                        >
                            <RefreshCw className="size-4" />
                            {t('fel.action_emit')}
                        </Button>
                    ) : null}
                    {can.void ? (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-fit gap-2"
                            onClick={() => setVoidOpen(true)}
                        >
                            <Ban className="size-4" />
                            {t('ventas.action_void')}
                        </Button>
                    ) : null}
                </div>
            </div>

            <PostSaleDocumentModal
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (!next) {
                        router.visit('/ventas');
                    }
                }}
                ticket={ticket}
                autoPrint={false}
                returnTo="ventas"
            />

            {can.void ? (
                <VoidSaleModal
                    open={voidOpen}
                    onOpenChange={setVoidOpen}
                    saleId={ticket.id}
                    saleNumber={ticket.numero}
                />
            ) : null}
        </>
    );
}

VentasShow.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(props.translations as TranslationTree, 'ventas.title'),
            href: '/ventas',
        },
        {
            title: props.ticket?.numero ?? translate(props.translations as TranslationTree, 'ventas.ticket_modal_title'),
            href: '#',
        },
    ],
});
