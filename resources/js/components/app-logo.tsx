export default function AppLogo() {
    return (
        <>
            {/* Pin de marca (único logo) */}
            <img
                src="/vamospe-05.png"
                alt="VanPe"
                className="aspect-square size-8 shrink-0 object-contain"
            />
            {/* Wordmark: se oculta cuando el sidebar está contraído */}
            <span className="ml-1 text-lg leading-none font-extrabold tracking-tight group-data-[collapsible=icon]:hidden">
                <span className="text-brand-blue dark:text-brand-blue-light">
                    van
                </span>
                <span className="text-brand-orange">PE</span>
            </span>
        </>
    );
}
