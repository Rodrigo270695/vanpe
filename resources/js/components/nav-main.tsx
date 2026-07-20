import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useTranslations } from '@/hooks/use-translations';
import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { t } = useTranslations();

    const isPlaceholder = (item: NavItem): boolean => toUrl(item.href) === '#';

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{t('nav.platform')}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    // ── Ítem con submenú desplegable ──
                    if (item.items && item.items.length > 0) {
                        const hasActiveChild = item.items.some(
                            (sub) =>
                                !isPlaceholder(sub) && isCurrentUrl(sub.href),
                        );

                        return (
                            <Collapsible
                                key={item.title}
                                asChild
                                defaultOpen={hasActiveChild}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={{ children: item.title }}
                                            isActive={hasActiveChild}
                                            className="group-data-[state=open]/collapsible:text-brand-blue dark:group-data-[state=open]/collapsible:text-brand-blue-light"
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[state=open]/collapsible:text-brand-orange" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                                        <SidebarMenuSub>
                                            {item.items.map((sub) => {
                                                const placeholder =
                                                    isPlaceholder(sub);

                                                return (
                                                    <SidebarMenuSubItem
                                                        key={sub.title}
                                                    >
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            className="nav-sub"
                                                            isActive={
                                                                !placeholder &&
                                                                isCurrentUrl(
                                                                    sub.href,
                                                                )
                                                            }
                                                        >
                                                            {placeholder ? (
                                                                <a href="#">
                                                                    {sub.icon && (
                                                                        <sub.icon />
                                                                    )}
                                                                    <span>
                                                                        {
                                                                            sub.title
                                                                        }
                                                                    </span>
                                                                </a>
                                                            ) : (
                                                                <Link
                                                                    href={
                                                                        sub.href
                                                                    }
                                                                    prefetch
                                                                >
                                                                    {sub.icon && (
                                                                        <sub.icon />
                                                                    )}
                                                                    <span>
                                                                        {
                                                                            sub.title
                                                                        }
                                                                    </span>
                                                                </Link>
                                                            )}
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                );
                                            })}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    }

                    // ── Ítem simple ──
                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
