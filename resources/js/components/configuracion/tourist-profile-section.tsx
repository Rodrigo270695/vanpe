import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CatalogChipSelect } from '@/components/common/catalog-chip-select';
import { StatusPill } from '@/components/common/status-pill';
import type {
    CatalogOptionsGrouped,
    CatalogProposalTenantRow,
} from '@/components/configuracion/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from '@/hooks/use-translations';
import { CATALOG_TYPE_THEMES } from '@/lib/catalog-visual';
import { cn } from '@/lib/utils';

const CATALOG_TYPES = ['cuisine', 'service', 'language', 'ambiance'] as const;

type TouristProfileSectionProps = {
    options: CatalogOptionsGrouped;
    selectionIds: string[];
    typeLabels: Record<string, string>;
    proposals: CatalogProposalTenantRow[];
    disabled?: boolean;
    onSelectionChange: (ids: string[]) => void;
};

export function TouristProfileSection({
    options,
    selectionIds,
    typeLabels,
    proposals,
    disabled = false,
    onSelectionChange,
}: TouristProfileSectionProps) {
    const { t } = useTranslations();
    const [proposeType, setProposeType] = useState<string | null>(null);

    const {
        data: proposalData,
        setData: setProposalData,
        post: postProposal,
        processing: proposing,
        errors: proposalErrors,
        reset: resetProposal,
    } = useForm({
        type: 'cuisine',
        suggested_name: '',
    });

    const selectionsByType = useMemo(() => {
        const map: Record<string, string[]> = {};
        for (const type of CATALOG_TYPES) {
            const typeIds = new Set(
                (options[type] ?? []).map((item) => item.id),
            );
            map[type] = selectionIds.filter((id) => typeIds.has(id));
        }
        return map;
    }, [options, selectionIds]);

    const updateTypeSelection = (type: string, ids: string[]) => {
        const otherTypes = CATALOG_TYPES.filter((item) => item !== type);
        const rest = otherTypes.flatMap((item) => selectionsByType[item] ?? []);
        onSelectionChange([...rest, ...ids]);
    };

    const submitProposal = (type: string) => {
        setProposalData({ type, suggested_name: proposalData.suggested_name });
        postProposal('/configuracion/catalog-proposals', {
            preserveScroll: true,
            onSuccess: () => {
                setProposeType(null);
                resetProposal();
            },
        });
    };

    const proposalStatusVariant = (
        status: CatalogProposalTenantRow['status'],
    ) => {
        if (status === 'approved') return 'green' as const;
        if (status === 'rejected') return 'red' as const;
        return 'amber' as const;
    };

    return (
        <div className="sm:col-span-2 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
                {CATALOG_TYPES.map((type) => {
                    const theme = CATALOG_TYPE_THEMES[type];
                    const TypeIcon = theme.tabIcon;

                    return (
                    <div
                        key={type}
                        className={cn(
                            'rounded-xl border p-3',
                            theme.card,
                        )}
                    >
                        <div className="mb-2 flex items-center gap-2">
                            <span
                                className={cn(
                                    'flex size-7 items-center justify-center rounded-md',
                                    theme.iconWrap,
                                )}
                            >
                                <TypeIcon className="size-3.5" />
                            </span>
                            <span className="text-[13px] font-semibold text-foreground">
                                {typeLabels[type] ?? type}
                            </span>
                        </div>
                        <CatalogChipSelect
                            label=""
                            options={(options[type] ?? []).map((item) => ({
                                id: item.id,
                                name: item.name,
                            }))}
                            value={selectionsByType[type] ?? []}
                            onChange={(ids) => updateTypeSelection(type, ids)}
                            disabled={disabled}
                            theme={theme}
                        />

                        {!disabled && (
                            <div className="mt-2 border-t border-dashed border-[#d0dbef] pt-2">
                                {proposeType === type ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Input
                                            value={proposalData.suggested_name}
                                            onChange={(e) =>
                                                setProposalData(
                                                    'suggested_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={t(
                                                'catalog.propose_placeholder',
                                            )}
                                            className="h-8 min-w-[140px] flex-1 bg-card text-sm"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={
                                                proposing ||
                                                proposalData.suggested_name.trim()
                                                    .length < 2
                                            }
                                            className={cn(
                                                'h-8 cursor-pointer',
                                                theme.proposeSubmit,
                                            )}
                                            onClick={() => submitProposal(type)}
                                        >
                                            {t('catalog.propose_submit')}
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 cursor-pointer"
                                            onClick={() => {
                                                setProposeType(null);
                                                resetProposal();
                                            }}
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProposeType(type);
                                            setProposalData({
                                                type,
                                                suggested_name: '',
                                            });
                                        }}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[12px] font-medium transition-colors',
                                            theme.proposeLink,
                                        )}
                                    >
                                        <Plus className="size-3.5" />
                                        {t('catalog.propose_link')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    );
                })}
            </div>

            {proposalErrors.suggested_name && (
                <p className="text-[12px] text-destructive">
                    {proposalErrors.suggested_name}
                </p>
            )}

            {proposals.length > 0 && (
                <div className="rounded-xl border border-[#d0dbef] bg-muted/20 p-3">
                    <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('catalog.your_proposals')}
                    </p>
                    <ul className="space-y-1.5">
                        {proposals.map((row) => (
                            <li
                                key={row.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-[13px]"
                            >
                                <span>
                                    <span className="font-medium">
                                        {row.suggested_name}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {' '}
                                        · {typeLabels[row.type] ?? row.type}
                                    </span>
                                </span>
                                <StatusPill
                                    variant={proposalStatusVariant(row.status)}
                                >
                                    {t(`catalog.status_${row.status}`)}
                                </StatusPill>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <p className="text-[12px] text-muted-foreground">
                {t('configuracion.tourist_profile_hint')}
            </p>
        </div>
    );
}
