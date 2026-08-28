type LegalBodyProps = {
    body: string;
};

const SECTION_PATTERN = /^(\d+\.\s.+)$/;

export function LegalBody({ body }: LegalBodyProps) {
    const blocks = body.split(/\n\n+/).filter(Boolean);

    return (
        <div className="legal-body space-y-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {blocks.map((block, index) => {
                const lines = block.split('\n');
                const firstLine = lines[0] ?? '';
                const isSection = SECTION_PATTERN.test(firstLine);

                if (isSection) {
                    const content = lines.slice(1).join('\n').trim();

                    return (
                        <section key={index}>
                            <h2 className="mb-2 text-base font-semibold text-foreground sm:text-lg">
                                {firstLine}
                            </h2>
                            {content ? (
                                <p className="whitespace-pre-line">{content}</p>
                            ) : null}
                        </section>
                    );
                }

                return (
                    <p key={index} className="whitespace-pre-line">
                        {block}
                    </p>
                );
            })}
        </div>
    );
}
