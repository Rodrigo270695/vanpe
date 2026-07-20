import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return (
        <img
            src="/vamospe-05.png"
            alt="VanPe"
            {...props}
        />
    );
}
