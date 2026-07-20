import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type UseAutoRefreshOptions = {
    intervalMs: number;
    only?: string[];
    enabled?: boolean;
    preserveScroll?: boolean;
};

export function useAutoRefresh({
    intervalMs,
    only,
    enabled = true,
    preserveScroll = true,
}: UseAutoRefreshOptions) {
    const [lastUpdatedAt, setLastUpdatedAt] = useState(() => Date.now());
    const [secondsAgo, setSecondsAgo] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const isRefreshingRef = useRef(false);

    const refresh = useCallback(() => {
        if (!enabled || isRefreshingRef.current) {
            return;
        }

        isRefreshingRef.current = true;
        setIsRefreshing(true);

        router.reload({
            only,
            preserveScroll,
            onFinish: () => {
                isRefreshingRef.current = false;
                setIsRefreshing(false);
                setLastUpdatedAt(Date.now());
            },
        });
    }, [enabled, only, preserveScroll]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const timer = window.setInterval(refresh, intervalMs);

        return () => window.clearInterval(timer);
    }, [enabled, intervalMs, refresh]);

    useEffect(() => {
        const tick = window.setInterval(() => {
            setSecondsAgo(Math.floor((Date.now() - lastUpdatedAt) / 1000));
        }, 1000);

        return () => window.clearInterval(tick);
    }, [lastUpdatedAt]);

    return {
        secondsAgo,
        intervalSeconds: Math.round(intervalMs / 1000),
        isRefreshing,
        refresh,
    };
}
