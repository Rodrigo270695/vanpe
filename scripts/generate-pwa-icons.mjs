import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourcePath = path.join(rootDir, 'public', 'vamospe-05.png');
const outputDir = path.join(rootDir, 'public', 'pwa');

const sizes = [48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512];

async function loadTrimmedLogo() {
    const { data, info } = await sharp(sourcePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8Array(data);

    for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];

        if (red < 45 && green < 45 && blue < 45) {
            pixels[index + 3] = 0;
        }
    }

    return sharp(Buffer.from(pixels), {
        raw: {
            width: info.width,
            height: info.height,
            channels: 4,
        },
    })
        .trim()
        .png()
        .toBuffer();
}

async function resizeLogo(trimmedLogo, targetSize) {
    return sharp(trimmedLogo)
        .resize(targetSize, targetSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
}

function circleSvg(size, radiusRatio) {
    const radius = (size * radiusRatio) / 2;

    return Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="#ffffff"/>
        </svg>`,
    );
}

async function createCircularIcon(size, trimmedLogo, outputName) {
    const circleRatio = 0.96;
    const logoRatio = 0.9;
    const logoSize = Math.round(size * circleRatio * logoRatio);
    const logo = await resizeLogo(trimmedLogo, logoSize);

    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
    })
        .composite([
            { input: circleSvg(size, circleRatio), gravity: 'center' },
            { input: logo, gravity: 'center' },
        ])
        .png()
        .toFile(path.join(outputDir, outputName));
}

async function createSquareIcon(size, trimmedLogo, outputName) {
    const logoSize = Math.round(size * 0.86);
    const logo = await resizeLogo(trimmedLogo, logoSize);

    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
    })
        .composite([{ input: logo, gravity: 'center' }])
        .png()
        .toFile(path.join(outputDir, outputName));
}

async function main() {
    await fs.mkdir(outputDir, { recursive: true });

    const trimmedLogo = await loadTrimmedLogo();

    for (const size of sizes) {
        const circularName =
            size === 180 ? 'apple-touch-icon.png' : `icon-${size}x${size}.png`;

        await createCircularIcon(size, trimmedLogo, circularName);
        console.log(`Generated ${circularName}`);

        const maskableName = `icon-maskable-${size}x${size}.png`;
        await createSquareIcon(size, trimmedLogo, maskableName);
        console.log(`Generated ${maskableName}`);
    }

    const manifest = {
        name: 'VanPe',
        short_name: 'VanPe',
        description: 'Gestión de restaurante',
        id: '/',
        scope: '/',
        start_url: '/dashboard',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#1d6fd4',
        lang: 'es',
        icons: [
            ...sizes.map((size) => ({
                src:
                    size === 180
                        ? '/pwa/apple-touch-icon.png'
                        : `/pwa/icon-${size}x${size}.png`,
                sizes: `${size}x${size}`,
                type: 'image/png',
                purpose: 'any',
            })),
            ...sizes.map((size) => ({
                src: `/pwa/icon-maskable-${size}x${size}.png`,
                sizes: `${size}x${size}`,
                type: 'image/png',
                purpose: 'maskable',
            })),
        ],
    };

    await fs.writeFile(
        path.join(rootDir, 'public', 'manifest.webmanifest'),
        `${JSON.stringify(manifest, null, 2)}\n`,
        'utf8',
    );

    console.log('Generated public/manifest.webmanifest');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
