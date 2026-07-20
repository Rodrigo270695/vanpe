export function buildA4FromTicket(ticketUrl: string): string {
    if (ticketUrl.includes('/pdf/a4/')) {
        return ticketUrl;
    }

    if (ticketUrl.includes('/pdf/ticket/')) {
        return ticketUrl.replace('/pdf/ticket/', '/pdf/a4/');
    }

    return ticketUrl;
}

export function buildTicketFromA4(a4Url: string): string {
    if (a4Url.includes('/pdf/ticket/')) {
        return a4Url;
    }

    if (a4Url.includes('/pdf/a4/')) {
        return a4Url.replace('/pdf/a4/', '/pdf/ticket/');
    }

    return a4Url;
}

export function resolveFelPdfUrls(
    urlPdf: string | null | undefined,
    urlPdfTicket?: string | null,
    urlPdfA4?: string | null,
): { ticket: string | null; a4: string | null } {
    const ticket = urlPdfTicket ?? urlPdf ?? null;
    const a4 = urlPdfA4 ?? (ticket ? buildA4FromTicket(ticket) : null);

    return { ticket, a4 };
}
