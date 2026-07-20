import { Bell, BellOff, BellRing, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useTranslations } from '@/hooks/use-translations';
import { isLikelyBravePushBlocked } from '@/lib/browser-support';
import { cn } from '@/lib/utils';

export function PushNotificationPrompt() {
    const { t } = useTranslations();
    const [mounted, setMounted] = useState(false);
    const { supported, permission, subscribed, swReady, loading, error, enable, disable } =
        usePushNotifications();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !supported) {
        return null;
    }

    const braveBlocked = isLikelyBravePushBlocked() && !subscribed && !error;
    const needsAttention = !subscribed && (permission !== 'denied' || error || braveBlocked);

    const tooltipLabel = subscribed
        ? t('push.active_title')
        : permission === 'denied'
          ? t('push.permission_denied')
          : braveBlocked
            ? t('push.brave_local_hint')
            : t('push.prompt_title');

    const Icon = subscribed ? BellRing : permission === 'denied' ? BellOff : Bell;

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="relative size-9 shrink-0 text-muted-foreground hover:text-foreground"
                            aria-label={tooltipLabel}
                        >
                            <Icon
                                className={cn(
                                    'size-4',
                                    subscribed && 'text-emerald-600 dark:text-emerald-400',
                                    permission === 'denied' && 'text-amber-600 dark:text-amber-400',
                                )}
                            />
                            {needsAttention && (
                                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand-blue ring-2 ring-background" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs">
                    {tooltipLabel}
                </TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" className="w-72 p-3">
                {subscribed ? (
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                                {t('push.active_title')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t('push.active_description')}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-full text-xs"
                            onClick={() => void disable()}
                            disabled={loading}
                        >
                            {loading ? (
                                <LoaderCircle className="size-3.5 animate-spin" />
                            ) : (
                                t('push.disable')
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                                {t('push.prompt_title')}
                            </p>
                            <p
                                className={cn(
                                    'text-xs',
                                    error ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
                                )}
                            >
                                {permission === 'denied'
                                    ? t('push.permission_denied')
                                    : braveBlocked
                                      ? t('push.brave_local_hint')
                                      : (error ??
                                        (!swReady
                                            ? t('push.preparing_sw')
                                            : t('push.prompt_description')))}
                            </p>
                        </div>
                        {permission !== 'denied' && !braveBlocked && (
                            <Button
                                type="button"
                                size="sm"
                                className="h-8 w-full text-xs"
                                onClick={() => void enable()}
                                disabled={loading || !swReady}
                            >
                                {loading ? (
                                    <LoaderCircle className="size-3.5 animate-spin" />
                                ) : (
                                    t('push.enable')
                                )}
                            </Button>
                        )}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
