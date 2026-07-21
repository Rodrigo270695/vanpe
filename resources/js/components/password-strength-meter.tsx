import { ShieldCheck } from 'lucide-react';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type Props = {
    password: string;
    passwordRules: string;
};

export default function PasswordStrengthMeter({
    password,
    passwordRules,
}: Props) {
    const { t } = useTranslations();
    const minimumLength = Number(
        passwordRules.match(/minlength:\s*(\d+)/i)?.[1] ?? 10,
    );
    const checks = [
        password.length >= minimumLength,
        /[a-z]/.test(password) && /[A-Z]/.test(password),
        /\d/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const level =
        password.length === 0 ? 0 : score <= 1 ? 1 : score <= 3 ? 2 : 3;
    const labels = [
        '',
        t('auth.password_strength_weak'),
        t('auth.password_strength_medium'),
        t('auth.password_strength_strong'),
    ];
    const labelColors = [
        '',
        'text-red-200',
        'text-amber-200',
        'text-emerald-200',
    ];
    const segmentColors = [
        'bg-white/20',
        'bg-red-400',
        'bg-amber-300',
        'bg-emerald-400',
    ];

    return (
        <div
            className="rounded-xl border border-white/15 bg-black/10 px-3 py-2.5"
            aria-live="polite"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 gap-1.5" aria-hidden="true">
                    {[1, 2, 3].map((segment) => (
                        <span
                            key={segment}
                            className={cn(
                                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                                segment <= level
                                    ? segmentColors[level]
                                    : 'bg-white/20',
                            )}
                        />
                    ))}
                </div>
                <span
                    className={cn(
                        'flex min-w-20 items-center justify-end gap-1 text-xs font-semibold',
                        level === 0 ? 'text-white/60' : labelColors[level],
                    )}
                >
                    <ShieldCheck className="size-3.5" />
                    {level === 0
                        ? t('auth.password_strength_empty')
                        : labels[level]}
                </span>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-white/70">
                {t('auth.password_strength_hint', { count: minimumLength })}
            </p>
        </div>
    );
}
