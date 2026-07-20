import { Head, router } from '@inertiajs/react';
import {
    KeyRound,
    Lock,
    Pencil,
    Plus,
    ShieldCheck,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { TableCard } from '@/components/common/table-card';
import { TableRowActions } from '@/components/common/table-row-actions';
import { RoleFormModal } from '@/components/roles/role-form-modal';
import { RolePermissionsModal } from '@/components/roles/role-permissions-modal';
import type {
    PermissionGroup,
    RoleAbilities,
    RoleRow,
    RoleScope,
} from '@/components/roles/types';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { formatLocaleDate, translate, type TranslationTree } from '@/lib/i18n';

type RolesPageProps = {
    roles: RoleRow[];
    scope: RoleScope;
    permissionsTotal: number;
    permissionCatalog: PermissionGroup[];
    can: RoleAbilities;
};

export default function RolesIndex({
    roles,
    scope,
    permissionCatalog,
    can,
}: RolesPageProps) {
    const { t, locale } = useTranslations();
    const isTenant = scope === 'tenant';

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<RoleRow | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [permsTarget, setPermsTarget] = useState<RoleRow | null>(null);

    const canCreate = can.create;
    const canUpdate = can.update;
    const canDelete = can.delete;
    const canPermissions = can.permissions;

    const table = useClientTable(roles, {
        searchable: ['name'],
        initialSort: { key: 'name', dir: 'asc' },
    });

    const protectedCount = roles.filter((r) => r.is_protected).length;
    const customCount = roles.length - protectedCount;

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (role: RoleRow) => {
        setEditing(role);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }
        setDeleting(true);
        router.delete(`/roles/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const columns: DataTableColumn<RoleRow>[] = useMemo(
        () => [
            {
                key: 'name',
                header: t('roles.col_name'),
                sortable: true,
                render: (role) => (
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-blue/10 text-brand-blue">
                            <ShieldCheck className="size-3.5" />
                        </span>
                        <span className="font-medium text-foreground">
                            {role.name}
                        </span>
                        {role.is_protected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                <Lock className="size-3" />
                                {t('table.system')}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                key: 'permissions_count',
                header: t('roles.col_permissions'),
                sortable: true,
                render: (role) => (
                    <span className="text-muted-foreground">
                        {role.permissions_count}
                    </span>
                ),
            },
            {
                key: 'created_at',
                header: t('roles.col_created'),
                sortable: true,
                render: (role) => (
                    <span className="text-muted-foreground">
                        {formatLocaleDate(role.created_at, locale)}
                    </span>
                ),
            },
        ],
        [t, locale],
    );

    const actions = (role: RoleRow) => (
        <TableRowActions
            items={[
                {
                    key: 'permissions',
                    label: t('roles.action_permissions'),
                    icon: KeyRound,
                    onClick: () => setPermsTarget(role),
                    hidden: !canPermissions || role.is_core,
                },
                {
                    key: 'edit',
                    label: role.is_protected
                        ? t('roles.action_system_role')
                        : t('roles.action_edit'),
                    icon: Pencil,
                    onClick: () => openEdit(role),
                    disabled: role.is_protected,
                    hidden: !canUpdate,
                },
                {
                    key: 'delete',
                    label: role.is_protected
                        ? t('roles.action_system_role')
                        : t('roles.action_delete'),
                    icon: Trash2,
                    onClick: () => setDeleteTarget(role),
                    disabled: role.is_protected,
                    variant: 'destructive',
                    hidden: !canDelete,
                },
            ]}
        />
    );

    return (
        <>
            <Head title={t('roles.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('roles.title')}
                    description={
                        isTenant
                            ? t('roles.description_tenant')
                            : t('roles.description_platform')
                    }
                    badges={[
                        {
                            label: t('roles.badge_roles'),
                            value: roles.length,
                            color: 'blue',
                            icon: ShieldCheck,
                        },
                        {
                            label: t('roles.badge_system'),
                            value: protectedCount,
                            color: 'yellow',
                            icon: Lock,
                        },
                        {
                            label: t('roles.badge_custom'),
                            value: customCount,
                            color: 'green',
                            icon: Sparkles,
                        },
                    ]}
                    action={
                        canCreate
                            ? {
                                  label: t('roles.new'),
                                  onClick: openCreate,
                                  icon: Plus,
                              }
                            : undefined
                    }
                />

                <TableCard
                    flush
                    toolbar={
                        <SearchInput
                            value={table.search}
                            onChange={table.setSearch}
                            placeholder={t('roles.search_placeholder')}
                        />
                    }
                    footer={
                        <Pagination
                            page={table.page}
                            perPage={table.perPage}
                            total={table.total}
                            onPageChange={table.setPage}
                            onPerPageChange={table.setPerPage}
                        />
                    }
                >
                    <DataTable
                        columns={columns}
                        data={table.pageItems}
                        rowKey={(role) => role.id}
                        sort={table.sort}
                        onSort={table.toggleSort}
                        actions={
                            canUpdate || canDelete || canPermissions
                                ? actions
                                : undefined
                        }
                        emptyMessage={t('roles.empty')}
                    />
                </TableCard>
            </div>

            {/* Crear / editar rol */}
            <RoleFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                role={editing}
            />

            {/* Gestionar permisos del rol */}
            <RolePermissionsModal
                open={permsTarget !== null}
                onOpenChange={(open) => !open && setPermsTarget(null)}
                role={permsTarget}
                catalog={permissionCatalog}
            />

            {/* Confirmar eliminación */}
            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('roles.delete_title')}
                description={
                    deleteTarget
                        ? t('roles.delete_confirm', { name: deleteTarget.name })
                        : ''
                }
                submitLabel={t('common.delete')}
                submitVariant="destructive"
                onSubmit={confirmDelete}
                submitting={deleting}
            >
                <p className="text-sm text-muted-foreground">
                    {t('roles.delete_warning')}
                </p>
            </BaseModal>
        </>
    );
}

RolesIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'roles.title',
            ),
            href: '/roles',
        },
    ],
});
