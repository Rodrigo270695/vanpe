import { router, usePage } from '@inertiajs/react';
import { Headphones, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';

type SupportModeProp = {
    active: boolean;
    actor_name: string;
    actor_email: string;
} | null;

export function SupportModeBanner() {
    const { t } = useTranslations();
    const supportMode = usePage().props.supportMode as SupportModeProp;
    const tenant = usePage().props.tenant as { name?: string } | null;
    const [exiting, setExiting] = useState(false);

    if (!supportMode?.active) {
        return null;
    }

    const tenantName = tenant?.name ?? 'tenant';

    return (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-300/80 bg-amber-50 px-4 py-2.5 text-amber-950 md:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
                <Headphones className="size-4 shrink-0 text-amber-700" />
                <p className="truncate text-sm font-medium">
                    {t('tenants.support_banner', { name: tenantName })}
                    {supportMode.actor_email ? (
                        <span className="ml-1 font-normal text-amber-800/80">
                            ({supportMode.actor_email})
                        </span>
                    ) : null}
                </p>
            </div>
            <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 border-amber-400 bg-white text-amber-950 hover:bg-amber-100"
                disabled={exiting}
                onClick={() => {
                    setExiting(true);
                    router.post(
                        '/auth/support/exit',
                        {},
                        {
                            onFinish: () => setExiting(false),
                        },
                    );
                }}
            >
                <LogOut className="size-3.5" />
                {t('tenants.support_exit')}
            </Button>
        </div>
    );
}
