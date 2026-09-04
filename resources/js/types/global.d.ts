import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            supportMode: {
                active: boolean;
                actor_name: string;
                actor_email: string;
            } | null;
            tenant: { slug: string; name: string; tipo?: 'restaurant' | 'tour_spot' } | null;
            sidebarOpen: boolean;
            locale: string;
            timezone: string;
            availableLocales: string[];
            translations: Record<string, unknown>;
            flash: { toast: import('@/types/ui').FlashToast | null };
            [key: string]: unknown;
        };
    }
}
