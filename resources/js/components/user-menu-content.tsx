import { Link, router } from '@inertiajs/react';
import { Check, Globe, LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useTranslations } from '@/hooks/use-translations';
import {
    LOCALE_LABELS,
    SUPPORTED_LOCALES,
    type SupportedLocale,
} from '@/lib/i18n';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const { t, locale, setLocale } = useTranslations();
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    const currentLocale = (
        SUPPORTED_LOCALES.includes(locale as SupportedLocale)
            ? locale
            : 'es'
    ) as SupportedLocale;

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        {t('user_menu.settings')}
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="cursor-pointer">
                        <Globe className="mr-2 size-4" />
                        <span>{t('language.label')}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                            {LOCALE_LABELS[currentLocale].flag}{' '}
                            {currentLocale.toUpperCase()}
                        </span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="min-w-40">
                        {SUPPORTED_LOCALES.map((code) => {
                            const label = LOCALE_LABELS[code];
                            const isActive = code === currentLocale;

                            return (
                                <DropdownMenuItem
                                    key={code}
                                    onSelect={() => setLocale(code)}
                                    className="cursor-pointer justify-between gap-2"
                                >
                                    <span className="flex items-center gap-2">
                                        <span aria-hidden>{label.flag}</span>
                                        <span>{label.native}</span>
                                    </span>
                                    {isActive && (
                                        <Check
                                            className="size-4 text-brand-blue"
                                            strokeWidth={2.5}
                                            aria-hidden
                                        />
                                    )}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    {t('user_menu.logout')}
                </Link>
            </DropdownMenuItem>
        </>
    );
}
