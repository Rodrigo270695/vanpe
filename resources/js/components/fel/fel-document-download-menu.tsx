import { router } from '@inertiajs/react';
import {
    Braces,
    Download,
    ExternalLink,
    Eye,
    FileText,
    MoreHorizontal,
} from 'lucide-react';
import type { FelDocumentSummary } from '@/components/fel/types';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from '@/hooks/use-translations';
import { resolveFelPdfUrls } from '@/lib/fel-pdf';

type FelDocumentDownloadMenuProps = {
    document: FelDocumentSummary;
    saleId?: string | null;
    onViewCpe?: () => void;
    showViewCpe?: boolean;
};

export function FelDocumentDownloadMenu({
    document,
    saleId,
    onViewCpe,
    showViewCpe = true,
}: FelDocumentDownloadMenuProps) {
    const { t } = useTranslations();
    const { ticket, a4 } = resolveFelPdfUrls(
        document.url_pdf,
        document.url_pdf_ticket,
        document.url_pdf_a4,
    );
    const resolvedSaleId = saleId ?? document.sale_id;

    const hasDownloads =
        document.tiene_xml ||
        document.tiene_cdr ||
        ticket ||
        a4 ||
        document.tiene_json;

    if (!hasDownloads && !resolvedSaleId) {
        return null;
    }

    return (
        <div className="flex items-center gap-1">
            {hasDownloads ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            aria-label={t('fel.action_download_menu', {
                                number: document.numero_completo,
                            })}
                        >
                            <Download className="size-3.5" aria-hidden />
                            {t('fel.action_download')}
                            <MoreHorizontal className="size-3.5 opacity-60" aria-hidden />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        {document.tiene_xml && document.download_xml_url ? (
                            <DropdownMenuItem asChild className="cursor-pointer gap-2">
                                <a href={document.download_xml_url}>
                                    <Download className="size-4" aria-hidden />
                                    {t('fel.action_xml')}
                                </a>
                            </DropdownMenuItem>
                        ) : null}
                        {document.tiene_cdr && document.download_cdr_url ? (
                            <DropdownMenuItem asChild className="cursor-pointer gap-2">
                                <a href={document.download_cdr_url}>
                                    <Download className="size-4" aria-hidden />
                                    {t('fel.action_cdr')}
                                </a>
                            </DropdownMenuItem>
                        ) : null}
                        {(document.tiene_xml || document.tiene_cdr) && (ticket || a4) ? (
                            <DropdownMenuSeparator />
                        ) : null}
                        {ticket ? (
                            <DropdownMenuItem asChild className="cursor-pointer gap-2">
                                <a href={ticket} target="_blank" rel="noreferrer">
                                    <FileText className="size-4" aria-hidden />
                                    {t('fel.action_pdf_ticket')}
                                    <ExternalLink className="ml-auto size-3 opacity-50" aria-hidden />
                                </a>
                            </DropdownMenuItem>
                        ) : null}
                        {a4 ? (
                            <DropdownMenuItem asChild className="cursor-pointer gap-2">
                                <a href={a4} target="_blank" rel="noreferrer">
                                    <FileText className="size-4" aria-hidden />
                                    {t('fel.action_pdf_a4')}
                                    <ExternalLink className="ml-auto size-3 opacity-50" aria-hidden />
                                </a>
                            </DropdownMenuItem>
                        ) : null}
                        {document.tiene_json && document.json_url ? (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild className="cursor-pointer gap-2">
                                    <a href={document.json_url} target="_blank" rel="noreferrer">
                                        <Braces className="size-4" aria-hidden />
                                        {t('fel.action_json')}
                                        <ExternalLink className="ml-auto size-3 opacity-50" aria-hidden />
                                    </a>
                                </DropdownMenuItem>
                            </>
                        ) : null}
                        {resolvedSaleId ? (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={() => router.visit(`/ventas/${resolvedSaleId}`)}
                                >
                                    <ExternalLink className="size-4" aria-hidden />
                                    {t('fel.action_sale')}
                                </DropdownMenuItem>
                            </>
                        ) : null}
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : null}
            {showViewCpe && onViewCpe ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={onViewCpe}
                    aria-label={t('fel.action_view_cpe')}
                >
                    <Eye className="size-4" />
                </Button>
            ) : null}
        </div>
    );
}
