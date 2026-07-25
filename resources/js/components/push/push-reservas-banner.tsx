import { Bell, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useTranslations } from '@/hooks/use-translations';
import { isLikelyBravePushBlocked } from '@/lib/browser-support';
import { cn } from '@/lib/utils';

/**
 * Banner destacado en /reservas: sin suscripción web push el staff
 * no recibe avisos de solicitudes de la app VanPe.
 */
export function PushReservasBanner() {
    const { t } = useTranslations();
    const [mounted, setMounted] = useState(false);
    const { supported, permission, subscribed, swReady, loading, error, enable } =
        usePushNotifications();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !supported || subscribed) {
        return null;
    }

    const braveBlocked = isLikelyBravePushBlocked();
    const denied = permission === 'denied';

    return (
        <div
            className={cn(
                'mx-4 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:mx-6',
                denied || braveBlocked
                    ? 'border-amber-300/80 bg-amber-50/80 dark:border-amber-700/50 dark:bg-amber-950/40'
                    : 'border-brand-blue/30 bg-brand-blue/5 dark:bg-brand-blue/10',
            )}
        >
            <div className="flex gap-3">
                <Bell className="mt-0.5 size-5 shrink-0 text-brand-blue" />
                <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                        {t('push.reservas_banner_title')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {denied
                            ? t('push.permission_denied')
                            : braveBlocked
                              ? t('push.brave_local_hint')
                              : (error ??
                                (!swReady
                                    ? t('push.preparing_sw')
                                    : t('push.reservas_banner_description')))}
                    </p>
                </div>
            </div>
            {!denied && !braveBlocked && (
                <Button
                    type="button"
                    size="sm"
                    className="h-9 shrink-0 text-xs"
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
    );
}
