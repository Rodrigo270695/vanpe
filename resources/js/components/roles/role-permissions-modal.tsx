import { useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import type { PermissionGroup, RoleRow } from '@/components/roles/types';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from '@/hooks/use-translations';
import { cn } from '@/lib/utils';

type RolePermissionsModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: RoleRow | null;
    catalog: PermissionGroup[];
};

/** Modal para asignar permisos a un rol mediante checkboxes compactos. */
export function RolePermissionsModal({
    open,
    onOpenChange,
    role,
    catalog,
}: RolePermissionsModalProps) {
    const { t } = useTranslations();
    const { data, setData, put, processing, reset, clearErrors } = useForm<{
        permissions: string[];
    }>({ permissions: [] });

    useEffect(() => {
        if (open && role) {
            setData('permissions', role.permissions);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, role]);

    const allNames = useMemo(
        () => catalog.flatMap((g) => g.permissions.map((p) => p.name)),
        [catalog],
    );

    const selected = new Set(data.permissions);
    const selectedCount = data.permissions.length;

    const toggle = (name: string) => {
        const next = new Set(selected);
        if (next.has(name)) {
            next.delete(name);
        } else {
            next.add(name);
        }
        setData('permissions', [...next]);
    };

    const toggleGroup = (group: PermissionGroup) => {
        const names = group.permissions.map((p) => p.name);
        const allOn = names.every((n) => selected.has(n));
        const next = new Set(selected);
        names.forEach((n) => (allOn ? next.delete(n) : next.add(n)));
        setData('permissions', [...next]);
    };

    const allSelected =
        allNames.length > 0 && allNames.every((n) => selected.has(n));
    const toggleAll = () => {
        setData('permissions', allSelected ? [] : allNames);
    };

    const submit = () => {
        if (!role) return;
        put(`/roles/${role.id}/permissions`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={
                role
                    ? t('roles.permissions_title', { name: role.name })
                    : t('roles.permissions_title_short')
            }
            description={t('roles.permissions_description')}
            submitLabel={t('roles.permissions_submit')}
            onSubmit={submit}
            submitting={processing}
            size="xl"
            contentClassName="flex max-h-[88vh] flex-col sm:max-w-3xl"
            onAfterClose={() => {
                reset();
                clearErrors();
            }}
        >
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                    <label className="flex flex-1 cursor-pointer items-center justify-between gap-2">
                        <span className="font-medium">{t('table.select_all')}</span>
                        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                    </label>
                    <span className="text-xs text-muted-foreground">
                        {t('roles.permissions_selected_count', {
                            selected: selectedCount,
                            total: allNames.length,
                        })}
                    </span>
                </div>

                {catalog.map((group) => {
                    const names = group.permissions.map((p) => p.name);
                    const groupSelected = names.filter((n) => selected.has(n)).length;
                    const groupAll = names.every((n) => selected.has(n));
                    const groupSome = !groupAll && groupSelected > 0;

                    return (
                        <div
                            key={group.key}
                            className="overflow-hidden rounded-lg border border-border"
                        >
                            <label className="flex cursor-pointer items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2">
                                <span className="flex min-w-0 items-center gap-2">
                                    <Checkbox
                                        checked={
                                            groupAll
                                                ? true
                                                : groupSome
                                                  ? 'indeterminate'
                                                  : false
                                        }
                                        onCheckedChange={() => toggleGroup(group)}
                                    />
                                    <span className="truncate text-xs font-semibold tracking-wide text-foreground uppercase">
                                        {group.label}
                                    </span>
                                </span>
                                <span className="shrink-0 text-[11px] text-muted-foreground">
                                    {groupSelected}/{names.length}
                                </span>
                            </label>

                            <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 p-2 sm:grid-cols-2">
                                {group.permissions.map((perm) => {
                                    const checked = selected.has(perm.name);
                                    return (
                                        <label
                                            key={perm.name}
                                            className={cn(
                                                'flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60',
                                                checked && 'text-foreground',
                                            )}
                                        >
                                            <Checkbox
                                                className="mt-0.5"
                                                checked={checked}
                                                onCheckedChange={() => toggle(perm.name)}
                                            />
                                            <span className="leading-snug">{perm.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </BaseModal>
    );
}
