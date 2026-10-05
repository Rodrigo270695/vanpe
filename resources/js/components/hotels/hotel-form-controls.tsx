import { Check, Star } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export function SectionTitle({ children }: { children: string }) {
    return (
        <h3 className="border-b border-border/80 pb-2 text-sm font-semibold text-brand-blue">
            {children}
        </h3>
    );
}

export function MultiChoiceGrid({
    values,
    selected,
    labelFor,
    onChange,
    columns = 'sm:grid-cols-2',
}: {
    values: string[];
    selected: string[];
    labelFor: (value: string) => string;
    onChange: (next: string[]) => void;
    columns?: string;
}) {
    const toggle = (value: string, checked: boolean) => {
        onChange(
            checked
                ? values.filter((v) => v === value || selected.includes(v))
                : selected.filter((v) => v !== value),
        );
    };

    return (
        <div className={cn('grid gap-2', columns)}>
            {values.map((value) => {
                const active = selected.includes(value);

                return (
                    <label
                        key={value}
                        className={cn(
                            'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                            active
                                ? 'border-brand-blue/40 bg-brand-blue/[0.06] font-medium'
                                : 'border-border bg-card hover:bg-muted/30',
                        )}
                    >
                        <Checkbox
                            checked={active}
                            onCheckedChange={(v) => toggle(value, v === true)}
                        />
                        <span>{labelFor(value)}</span>
                    </label>
                );
            })}
        </div>
    );
}

export function SingleChoiceGrid({
    values,
    selected,
    labelFor,
    onChange,
    columns = 'sm:grid-cols-2',
}: {
    values: string[];
    selected: string;
    labelFor: (value: string) => string;
    onChange: (next: string) => void;
    columns?: string;
}) {
    return (
        <div className={cn('grid gap-2', columns)}>
            {values.map((value) => {
                const active = selected === value;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onChange(value)}
                        className={cn(
                            'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                            active
                                ? 'border-brand-blue/40 bg-brand-blue/[0.06] font-medium'
                                : 'border-border bg-card hover:bg-muted/30',
                        )}
                    >
                        <span
                            className={cn(
                                'flex size-4 shrink-0 items-center justify-center rounded-full border',
                                active
                                    ? 'border-brand-blue bg-brand-blue text-white'
                                    : 'border-input',
                            )}
                        >
                            {active && <Check className="size-3" />}
                        </span>
                        <span>{labelFor(value)}</span>
                    </button>
                );
            })}
        </div>
    );
}

export function ClassificationPicker({
    values,
    selected,
    onChange,
    labelFor,
    noCategoryHint,
}: {
    values: string[];
    selected: string;
    onChange: (next: string) => void;
    labelFor: (value: string) => string;
    noCategoryHint: string;
}) {
    return (
        <div className="grid gap-2 sm:grid-cols-3">
            {values.map((value) => {
                const active = selected === value;
                const stars = Number.parseInt(value, 10);
                const hasStars = Number.isFinite(stars) && stars > 0;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onChange(value)}
                        className={cn(
                            'flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                            active
                                ? 'border-brand-orange/50 bg-brand-orange/[0.08] font-medium'
                                : 'border-border bg-card hover:bg-muted/30',
                            !hasStars && 'sm:col-span-3',
                        )}
                    >
                        {hasStars ? (
                            <span className="flex items-center gap-0.5 text-brand-orange">
                                {Array.from({ length: stars }).map((_, i) => (
                                    <Star key={i} className="size-4 fill-current" />
                                ))}
                            </span>
                        ) : null}
                        <span>{labelFor(value)}</span>
                        {!hasStars && (
                            <span className="text-xs font-normal text-muted-foreground">
                                {noCategoryHint}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export function Textarea({
    value,
    onChange,
    rows = 3,
    maxLength,
}: {
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    maxLength?: number;
}) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            maxLength={maxLength}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm disabled:opacity-60"
        />
    );
}
