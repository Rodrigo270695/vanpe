type LegalBodyProps = {
    body: string;
};

const SECTION_PATTERN = /^(\d+\.\s.+)$/;

export function LegalBody({ body }: LegalBodyProps) {
    const blocks = body.split(/\n\n+/).filter(Boolean);

    return (
        <div className="legal-body space-y-6 text-[15px] leading-7 text-slate-700 sm:text-base dark:text-slate-300">
            {blocks.map((block, index) => {
                const lines = block.split('\n');
                const firstLine = lines[0] ?? '';
                const isSection = SECTION_PATTERN.test(firstLine);

                if (isSection) {
                    const content = lines.slice(1).join('\n').trim();

                    return (
                        <section
                            key={index}
                            className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100 sm:px-5 dark:bg-slate-800/50 dark:ring-slate-700/80"
                        >
                            <h2 className="mb-2 text-base font-bold text-slate-900 sm:text-lg dark:text-white">
                                {firstLine}
                            </h2>
                            {content ? (
                                <p className="whitespace-pre-line">{content}</p>
                            ) : null}
                        </section>
                    );
                }

                return (
                    <p
                        key={index}
                        className="whitespace-pre-line text-slate-800 dark:text-slate-200"
                    >
                        {block}
                    </p>
                );
            })}
        </div>
    );
}
