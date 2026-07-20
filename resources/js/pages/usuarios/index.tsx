import { Head, router } from '@inertiajs/react';
import {
    Clock,
    Lock,
    Pencil,
    Plus,
    Send,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserCircle,
    Users,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { SearchInput } from '@/components/common/search-input';
import { TableCard } from '@/components/common/table-card';
import { TableRowActions } from '@/components/common/table-row-actions';
import { UserFormModal } from '@/components/usuarios/user-form-modal';
import type {
    UserAbilities,
    UserRow,
    UserScope,
} from '@/components/usuarios/types';
import { useClientTable } from '@/hooks/use-client-table';
import { useTranslations } from '@/hooks/use-translations';
import { formatLocaleDate, translate, type TranslationTree } from '@/lib/i18n';

type UsuariosPageProps = {
    users: UserRow[];
    scope: UserScope;
    availableRoles: string[];
    can: UserAbilities;
};

export default function UsuariosIndex({
    users,
    scope,
    availableRoles,
    can,
}: UsuariosPageProps) {
    const { t, locale } = useTranslations();
    const isTenant = scope === 'tenant';

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<UserRow | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const canCreate = can.create;
    const canUpdate = can.update;
    const canDelete = can.delete;

    const table = useClientTable(users, {
        searchable: ['name', 'email', 'username'],
        initialSort: { key: 'name', dir: 'asc' },
    });

    const activeCount = users.filter((u) => u.active).length;
    const protectedCount = users.filter((u) => u.is_protected).length;
    const pendingCount = users.filter((u) => u.is_pending).length;

    const resendInvite = (user: UserRow) => {
        router.post(
            `/usuarios/${user.id}/invitacion`,
            {},
            { preserveScroll: true },
        );
    };

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (user: UserRow) => {
        setEditing(user);
        setFormOpen(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }
        setDeleting(true);
        router.delete(`/usuarios/${deleteTarget.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    };

    const columns: DataTableColumn<UserRow>[] = useMemo(
        () => [
            {
                key: 'name',
                header: t('users.col_user'),
                sortable: true,
                render: (user) => (
                    <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
                            <UserCircle className="size-4.5" />
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="truncate font-medium text-foreground">
                                    {user.name}
                                </span>
                                {user.is_self && (
                                    <span className="rounded-full bg-brand-blue/12 px-1.5 py-0.5 text-[10px] font-semibold text-brand-blue">
                                        {t('users.badge_you')}
                                    </span>
                                )}
                                {user.is_protected && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                        <Lock className="size-2.5" />
                                        {t('table.system')}
                                    </span>
                                )}
                            </div>
                            <span className="truncate text-xs text-muted-foreground">
                                {user.email}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'username',
                header: t('users.col_username'),
                sortable: true,
                render: (user) => (
                    <span className="text-muted-foreground">
                        {user.username || '—'}
                    </span>
                ),
            },
            {
                key: 'document',
                header: t('users.col_document'),
                render: (user) =>
                    user.document_number ? (
                        <span className="text-muted-foreground">
                            <span className="mr-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                                {user.document_type ?? 'DOC'}
                            </span>
                            {user.document_number}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    ),
            },
            {
                key: 'roles',
                header: t('users.col_roles'),
                render: (user) =>
                    user.roles.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                    ) : (
                        <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                                <span
                                    key={role}
                                    className="inline-flex items-center gap-1 rounded-full bg-brand-blue/8 px-2 py-0.5 text-[11px] font-medium text-brand-blue dark:bg-brand-blue/20 dark:text-brand-blue-light"
                                >
                                    <ShieldCheck className="size-3" />
                                    {role}
                                </span>
                            ))}
                        </div>
                    ),
            },
            {
                key: 'active',
                header: t('users.col_status'),
                sortable: true,
                align: 'center',
                render: (user) =>
                    user.is_pending ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            <Clock className="size-3" />
                            {t('users.status_pending')}
                        </span>
                    ) : user.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <UserCheck className="size-3" />
                            {t('users.status_active')}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {t('users.status_inactive')}
                        </span>
                    ),
            },
            {
                key: 'created_at',
                header: t('users.col_created'),
                sortable: true,
                render: (user) => (
                    <span className="text-muted-foreground">
                        {formatLocaleDate(user.created_at, locale)}
                    </span>
                ),
            },
        ],
        [t, locale],
    );

    const actions = (user: UserRow) => (
        <TableRowActions
            items={[
                {
                    key: 'resend',
                    label: t('users.action_resend_invite'),
                    icon: Send,
                    onClick: () => resendInvite(user),
                    hidden: !(isTenant && user.is_pending && canCreate),
                },
                {
                    key: 'edit',
                    label: t('users.action_edit'),
                    icon: Pencil,
                    onClick: () => openEdit(user),
                    hidden: !canUpdate,
                },
                {
                    key: 'delete',
                    label: user.is_self
                        ? t('users.action_cannot_delete_self')
                        : user.is_protected
                          ? t('users.action_protected')
                          : t('users.action_delete'),
                    icon: Trash2,
                    onClick: () => setDeleteTarget(user),
                    disabled: user.is_self || user.is_protected,
                    variant: 'destructive',
                    hidden: !canDelete,
                },
            ]}
        />
    );

    return (
        <>
            <Head title={t('users.title')} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <PageHeader
                    title={t('users.title')}
                    description={
                        isTenant
                            ? t('users.description_tenant')
                            : t('users.description_platform')
                    }
                    badges={[
                        {
                            label: t('users.badge_users'),
                            value: users.length,
                            color: 'blue',
                            icon: Users,
                        },
                        {
                            label: t('users.badge_active'),
                            value: activeCount,
                            color: 'green',
                            icon: UserCheck,
                        },
                        ...(isTenant
                            ? ([
                                  {
                                      label: t('users.badge_pending'),
                                      value: pendingCount,
                                      color: 'orange' as const,
                                      icon: Clock,
                                  },
                              ])
                            : []),
                        {
                            label: t('users.badge_protected'),
                            value: protectedCount,
                            color: 'yellow',
                            icon: Lock,
                        },
                    ]}
                    action={
                        canCreate
                            ? {
                                  label: t('users.new'),
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
                            placeholder={t('users.search_placeholder')}
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
                        rowKey={(user) => user.id}
                        sort={table.sort}
                        onSort={table.toggleSort}
                        actions={
                            canUpdate || canDelete || canCreate
                                ? actions
                                : undefined
                        }
                        emptyMessage={t('users.empty')}
                    />
                </TableCard>
            </div>

            {/* Crear / editar usuario */}
            <UserFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                user={editing}
                scope={scope}
                availableRoles={availableRoles}
                can={can}
            />

            {/* Confirmar eliminación */}
            <BaseModal
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title={t('users.delete_title')}
                description={
                    deleteTarget
                        ? t('users.delete_confirm', { name: deleteTarget.name })
                        : ''
                }
                submitLabel={t('common.delete')}
                submitVariant="destructive"
                onSubmit={confirmDelete}
                submitting={deleting}
            >
                <p className="text-sm text-muted-foreground">
                    {t('users.delete_warning')}
                </p>
            </BaseModal>
        </>
    );
}

UsuariosIndex.layout = (props) => ({
    breadcrumbs: [
        {
            title: translate(
                props.translations as TranslationTree,
                'users.title',
            ),
            href: '/usuarios',
        },
    ],
});
