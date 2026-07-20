import { Breadcrumbs } from '@/components/breadcrumbs';
import { PushNotificationPrompt } from '@/components/push/push-notification-prompt';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="clay-header flex h-16 w-full shrink-0 items-center gap-2.5 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <SidebarTrigger className="-ml-1 text-brand-blue hover:bg-brand-blue/10 hover:text-brand-blue" />
            <span className="h-5 w-1 shrink-0 rounded-full bg-brand-blue/70" />
            <Breadcrumbs breadcrumbs={breadcrumbs} />
            <div className="ml-auto flex items-center gap-1">
                <PushNotificationPrompt />
            </div>
        </header>
    );
}
