import { registerAppServiceWorker } from '@/lib/register-service-worker';

if (typeof window !== 'undefined') {
    void registerAppServiceWorker();
}
