type LegalPageHeaderProps = {
    title: string;
    updated: string;
};

export function LegalPageHeader({ title, updated }: LegalPageHeaderProps) {
    return (
        <header className="mb-8 border-b border-slate-200 pb-6 dark:border-slate-700">
            <p className="text-xs font-semibold tracking-wide text-brand-blue uppercase dark:text-brand-blue-light">
                VanPe · Perú
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                {title}
            </h1>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                {updated}
            </p>
        </header>
    );
}
