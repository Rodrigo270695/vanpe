import { useForm } from '@inertiajs/react';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BaseModal } from '@/components/common/base-modal';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/hooks/use-translations';
import type {
    UserAbilities,
    UserRow,
    UserScope,
} from '@/components/usuarios/types';

type UserFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Usuario a editar; `null` para crear uno nuevo. */
    user: UserRow | null;
    scope: UserScope;
    availableRoles: string[];
    can: UserAbilities;
};

type UserForm = {
    document_type: string;
    document_number: string;
    first_name: string;
    paternal_surname: string;
    maternal_surname: string;
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
    roles: string[];
    active: boolean;
    invite: boolean;
};

// Valor centinela para "sin rol" (Radix Select no admite value="").
const NONE_ROLE = '__none__';

const emptyForm: UserForm = {
    document_type: 'DNI',
    document_number: '',
    first_name: '',
    paternal_surname: '',
    maternal_surname: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    roles: [],
    active: true,
    invite: true,
};

/**
 * Usuario sugerido: 1.ª letra del primer nombre + apellido paterno +
 * 1.ª letra del apellido materno (sin tildes ni espacios, en minúsculas).
 */
const buildUsername = (
    firstName: string,
    paternal: string,
    maternal: string,
): string => {
    const firstGiven = firstName.trim().split(/\s+/)[0] ?? '';
    const raw =
        (firstGiven.charAt(0) ?? '') +
        paternal.trim() +
        (maternal.trim().charAt(0) ?? '');

    return raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
};

type LookupState = 'idle' | 'loading' | 'done' | 'error';

export function UserFormModal({
    open,
    onOpenChange,
    user,
    scope,
    availableRoles,
    can,
}: UserFormModalProps) {
    const { t } = useTranslations();
    const isEditing = user !== null;
    const isTenant = scope === 'tenant';
    const rolesLocked = isEditing && user.is_protected;

    // La invitación por correo solo está disponible al crear personal del restaurante.
    const canInvite = isTenant && !isEditing;

    const documentTypes = useMemo(
        () => [
            { value: 'DNI', label: t('users.doc_dni') },
            { value: 'CE', label: t('users.doc_ce') },
            { value: 'PASSPORT', label: t('users.doc_passport') },
            { value: 'RUC', label: t('users.doc_ruc') },
        ],
        [t],
    );

    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm<UserForm>({ ...emptyForm });

    // Si el usuario edita manualmente el campo, dejamos de autogenerarlo.
    const [usernameEdited, setUsernameEdited] = useState(false);
    const [lookup, setLookup] = useState<LookupState>('idle');
    const [lookupMessage, setLookupMessage] = useState('');
    const lastLookup = useRef('');

    useEffect(() => {
        if (open && user) {
            setData({
                document_type: user.document_type ?? 'DNI',
                document_number: user.document_number ?? '',
                first_name: user.first_name ?? '',
                paternal_surname: user.paternal_surname ?? '',
                maternal_surname: user.maternal_surname ?? '',
                username: user.username ?? '',
                email: user.email,
                password: '',
                password_confirmation: '',
                roles: user.roles,
                active: user.active,
                invite: false,
            });
            setUsernameEdited(true);
            setLookup('idle');
            setLookupMessage('');
            lastLookup.current = '';
        }
        if (open && !user) {
            setUsernameEdited(false);
            setLookup('idle');
            setLookupMessage('');
            lastLookup.current = '';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, user]);

    // Autogeneración del usuario a partir de nombres/apellidos.
    useEffect(() => {
        if (usernameEdited) {
            return;
        }
        const suggested = buildUsername(
            data.first_name,
            data.paternal_surname,
            data.maternal_surname,
        );
        if (suggested !== data.username) {
            setData('username', suggested);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.first_name, data.paternal_surname, data.maternal_surname, usernameEdited]);

    const inviteMode = canInvite && data.invite;
    const isDni = data.document_type === 'DNI';

    const runDniLookup = async (numero: string) => {
        if (lastLookup.current === numero) {
            return;
        }
        lastLookup.current = numero;
        setLookup('loading');
        setLookupMessage('');

        try {
            const res = await fetch(`/documento/dni/${numero}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            const json = await res.json();

            if (res.ok && json?.success) {
                setData('first_name', json.data.first_name ?? '');
                setData('paternal_surname', json.data.paternal_surname ?? '');
                setData('maternal_surname', json.data.maternal_surname ?? '');
                setLookup('done');
                setLookupMessage('');
            } else {
                setLookup('error');
                setLookupMessage(
                    json?.message ?? t('users.lookup_not_found'),
                );
            }
        } catch {
            setLookup('error');
            setLookupMessage(t('users.lookup_error'));
        }
    };

    const onDocumentNumberChange = (value: string) => {
        if (isDni) {
            const digits = value.replace(/\D/g, '').slice(0, 8);
            setData('document_number', digits);
            if (digits.length === 8) {
                void runDniLookup(digits);
            } else {
                setLookup('idle');
                setLookupMessage('');
                lastLookup.current = '';
            }
            return;
        }
        setData('document_number', value);
    };

    const onDocumentTypeChange = (value: string) => {
        setData('document_type', value);
        setLookup('idle');
        setLookupMessage('');
        lastLookup.current = '';
    };

    const canSubmit =
        data.first_name.trim().length > 0 &&
        data.paternal_surname.trim().length > 0 &&
        data.email.trim().length > 0;

    const selectedRole = data.roles[0] ?? '';
    // No se puede cambiar el estado de un rol del sistema ni de tu propia cuenta.
    const estadoLocked = isEditing && (user.is_self || user.is_protected);

    const submit = () => {
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (isEditing) {
            put(`/usuarios/${user.id}`, options);
        } else {
            post('/usuarios', options);
        }
    };

    return (
        <BaseModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEditing ? t('users.edit_title') : t('users.create_title')}
            description={
                isTenant
                    ? t('users.description_tenant_form')
                    : t('users.description_platform_form')
            }
            submitLabel={
                isEditing ? t('table.save_changes') : t('users.create_submit')
            }
            onSubmit={submit}
            canSubmit={canSubmit}
            submitting={processing}
            size="lg"
            onAfterClose={() => {
                reset();
                clearErrors();
                setUsernameEdited(false);
                setLookup('idle');
                setLookupMessage('');
                lastLookup.current = '';
            }}
        >
            {/* Documento (siempre primero) */}
            <div className="grid items-start gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="user-doc-type">{t('users.doc_type')}</Label>
                    <Select
                        value={data.document_type}
                        onValueChange={onDocumentTypeChange}
                    >
                        <SelectTrigger id="user-doc-type" className="w-full">
                            <SelectValue placeholder={t('users.doc_select')} />
                        </SelectTrigger>
                        <SelectContent>
                            {documentTypes.map((doc) => (
                                <SelectItem key={doc.value} value={doc.value}>
                                    {doc.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.document_type} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="user-doc-number">
                        {t('users.doc_number')}
                        {isDni && <span className="text-red-500"> *</span>}
                    </Label>
                    <div className="relative">
                        <Input
                            id="user-doc-number"
                            inputMode={isDni ? 'numeric' : 'text'}
                            value={data.document_number}
                            onChange={(e) =>
                                onDocumentNumberChange(e.target.value)
                            }
                            placeholder={isDni ? '12345678' : t('users.doc_placeholder')}
                            autoComplete="off"
                            className={cn(isDni && 'pr-16')}
                        />
                        {isDni && (
                            <div className="pointer-events-none absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-1.5">
                                {lookup === 'loading' && (
                                    <Loader2 className="size-4 animate-spin text-brand-blue" />
                                )}
                                {lookup === 'error' && (
                                    <AlertCircle className="size-4 text-red-500" />
                                )}
                                <span
                                    className={cn(
                                        'text-xs font-medium tabular-nums',
                                        lookup === 'error'
                                            ? 'text-red-500'
                                            : data.document_number.length === 8
                                              ? 'text-brand-blue'
                                              : 'text-muted-foreground',
                                    )}
                                >
                                    {data.document_number.length}/8
                                </span>
                            </div>
                        )}
                    </div>
                    {isDni && lookup === 'error' && (
                        <p className="text-xs text-red-500">{lookupMessage}</p>
                    )}
                    <InputError message={errors.document_number} />
                </div>
            </div>

            {/* Nombres y apellidos */}
            <div className="grid items-start gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                    <Label htmlFor="user-first-name">
                        {t('users.first_name')}{' '}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="user-first-name"
                        value={data.first_name}
                        onChange={(e) => setData('first_name', e.target.value)}
                        placeholder="Ana María"
                        autoComplete="off"
                    />
                    <InputError message={errors.first_name} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="user-paternal">
                        {t('users.paternal_surname')}{' '}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="user-paternal"
                        value={data.paternal_surname}
                        onChange={(e) =>
                            setData('paternal_surname', e.target.value)
                        }
                        placeholder="Torres"
                        autoComplete="off"
                    />
                    <InputError message={errors.paternal_surname} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="user-maternal">
                        {t('users.maternal_surname')}
                    </Label>
                    <Input
                        id="user-maternal"
                        value={data.maternal_surname}
                        onChange={(e) =>
                            setData('maternal_surname', e.target.value)
                        }
                        placeholder="Ríos"
                        autoComplete="off"
                    />
                    <InputError message={errors.maternal_surname} />
                </div>
            </div>

            {/* Acceso */}
            <div className="grid items-start gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="user-username">{t('users.username')}</Label>
                    <Input
                        id="user-username"
                        value={data.username}
                        onChange={(e) => {
                            setUsernameEdited(true);
                            setData('username', e.target.value);
                        }}
                        placeholder="atorresr"
                        autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('users.username_hint')}
                    </p>
                    <InputError message={errors.username} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="user-email">
                        {t('users.email')}{' '}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="user-email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="ana@correo.com"
                        autoComplete="off"
                    />
                    <InputError message={errors.email} />
                </div>

                {!inviteMode && (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="user-password">
                                {t('users.password')}
                                {!isEditing && (
                                    <span className="text-red-500"> *</span>
                                )}
                            </Label>
                            <Input
                                id="user-password"
                                type="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                placeholder={
                                    isEditing
                                        ? t('users.password_blank_edit')
                                        : '••••••••'
                                }
                                autoComplete="new-password"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="user-password-confirm">
                                {t('users.password_confirm')}
                            </Label>
                            <Input
                                id="user-password-confirm"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Invitación por correo (solo al crear personal del restaurante) */}
            {canInvite && (
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-brand-blue/5 px-3 py-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                        <Mail className="size-4 text-brand-blue" />
                        <div>
                            <span className="font-medium text-foreground">
                                {t('users.invite_title')}
                            </span>
                            <p className="text-xs text-muted-foreground">
                                {t('users.invite_description')}
                            </p>
                        </div>
                    </div>
                    <Checkbox
                        checked={data.invite}
                        onCheckedChange={(v) => setData('invite', v === true)}
                    />
                </label>
            )}

            {/* Estado y rol */}
            <div className="grid items-start gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="user-estado">{t('users.status')}</Label>
                    <Select
                        value={data.active ? 'active' : 'inactive'}
                        onValueChange={(v) => setData('active', v === 'active')}
                        disabled={estadoLocked}
                    >
                        <SelectTrigger id="user-estado" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">
                                {t('users.status_active')}
                            </SelectItem>
                            <SelectItem value="inactive">
                                {t('users.status_inactive')}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {t('users.status_hint')}
                    </p>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="user-rol">{t('users.role')}</Label>
                    <Select
                        value={selectedRole || NONE_ROLE}
                        onValueChange={(v) =>
                            setData('roles', v === NONE_ROLE ? [] : [v])
                        }
                        disabled={
                            rolesLocked ||
                            !can.roles ||
                            availableRoles.length === 0
                        }
                    >
                        <SelectTrigger id="user-rol" className="w-full">
                            <SelectValue placeholder={t('users.role_select')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE_ROLE}>
                                {t('users.role_none')}
                            </SelectItem>
                            {availableRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {rolesLocked ? (
                        <p className="text-xs text-muted-foreground">
                            {t('users.role_locked')}
                        </p>
                    ) : (
                        <InputError message={errors.roles} />
                    )}
                </div>
            </div>
        </BaseModal>
    );
}
