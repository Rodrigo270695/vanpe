import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FormFieldProps = {
    label: string;
    htmlFor?: string;
    required?: boolean;
    hint?: string;
    error?: string;
    className?: string;
    children: ReactNode;
};

export function RequiredMark() {
    return <span className="text-red-500">*</span>;
}

export function FormField({
    label,
    htmlFor,
    required,
    hint,
    error,
    className,
    children,
}: FormFieldProps) {
    return (
        <div className={cn('grid gap-2', className)}>
            <Label htmlFor={htmlFor} className="text-sm font-medium">
                {label}
                {required && (
                    <>
                        {' '}
                        <RequiredMark />
                    </>
                )}
            </Label>
            {children}
            {hint && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            <InputError message={error} />
        </div>
    );
}
