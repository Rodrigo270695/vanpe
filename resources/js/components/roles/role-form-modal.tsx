import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RoleRow } from '@/components/roles/types';
import { useTranslations } from '@/hooks/use-translations';

type RoleFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Rol a editar; `null` para crear uno nuevo. */
    role: RoleRow | null;
};

export function RoleFormModal({ open, onOpenChange, role }: RoleFormModalProps) {
    const { t } = useTranslations();
    const isEditing = role !== null;
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({ name: '' });

    useEffect(() => {
        if (open && role) {
            setData('name', role.name);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, role]);

    const canSubmit = data.name.trim().length > 0;

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/roles/${role.id}`, options);
        } else {
            post('/roles', options);
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? t('roles.edit_title') : t('roles.create_title')}
            submitLabel={
                isEditing ? t('table.save_changes') : t('roles.create_submit')
            }
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={processing}
            onAfterClose={() => {
                reset();
                clearErrors();
            }}
        >
            <div className="grid gap-2">
                <Label htmlFor="role-name">
                    {t('roles.field_name')}{' '}
                    <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="role-name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder={t('roles.field_name_placeholder')}
                    autoFocus
                    autoComplete="off"
                />
                <InputError message={errors.name} />
            </div>
        </BaseModal>
    );
}
