import type { ReactNode } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ChartCardProps = {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
};

export function ChartCard({
    title,
    description,
    children,
    className,
    contentClassName,
}: ChartCardProps) {
    return (
        <Card className={cn('gap-0 py-0 shadow-sm', className)}>
            <CardHeader className="border-b border-border/60 px-5 py-4">
                <CardTitle className="text-base">{title}</CardTitle>
                {description ? (
                    <CardDescription>{description}</CardDescription>
                ) : null}
            </CardHeader>
            <CardContent className={cn('p-5', contentClassName)}>
                {children}
            </CardContent>
        </Card>
    );
}
