"""Generate Expo app icon + splash from VanPe public logos."""

from pathlib import Path

from PIL import Image

SRC_05 = Path(r"d:\Programacion\Laravel\LaraReact\vanpe\public\vamospe-05.png")
SRC_01 = Path(r"d:\Programacion\Laravel\LaraReact\vanpe\public\vamospe-01.png")
OUT = Path(r"D:\Programacion\ReactNative\vanpe-app\assets\images")
BRAND = Path(r"D:\Programacion\ReactNative\vanpe-app\assets\brand")

BLACK = (0, 0, 0, 255)
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)


def fit_on_canvas(src_path: Path, size: int, bg: tuple[int, int, int, int], scale: float = 0.72) -> Image.Image:
    logo = Image.open(src_path).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), bg)
    max_side = int(size * scale)
    logo.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    canvas.paste(logo, (x, y), logo)
    return canvas


def main() -> None:
    BRAND.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    Image.open(SRC_05).save(BRAND / "icon-source.png")
    Image.open(SRC_01).save(BRAND / "splash-source.png")

    # Install icon — pin V on white
    icon = fit_on_canvas(SRC_05, 1024, WHITE, scale=0.82)
    icon.convert("RGB").save(OUT / "icon.png", optimize=True)

    # Android adaptive foreground (safe zone)
    fg = fit_on_canvas(SRC_05, 1024, TRANSPARENT, scale=0.62)
    fg.save(OUT / "android-icon-foreground.png", optimize=True)

    Image.new("RGB", (1024, 1024), (255, 255, 255)).save(OUT / "android-icon-background.png", optimize=True)

    # Monochrome silhouette
    mono_src = Image.open(SRC_05).convert("RGBA")
    mono = Image.new("RGBA", (1024, 1024), TRANSPARENT)
    mono_src.thumbnail((int(1024 * 0.62), int(1024 * 0.62)), Image.Resampling.LANCZOS)
    _r, _g, _b, a = mono_src.split()
    white = Image.new("L", mono_src.size, 255)
    mono_logo = Image.merge("RGBA", (white, white, white, a))
    mx = (1024 - mono_logo.width) // 2
    my = (1024 - mono_logo.height) // 2
    mono.paste(mono_logo, (mx, my), mono_logo)
    mono.save(OUT / "android-icon-monochrome.png", optimize=True)

    # Splash — wordmark
    splash = fit_on_canvas(SRC_01, 1024, BLACK, scale=0.78)
    splash.convert("RGB").save(OUT / "splash-icon.png", optimize=True)

    fav = fit_on_canvas(SRC_05, 48, WHITE, scale=0.9)
    fav.convert("RGB").save(OUT / "favicon.png", optimize=True)

    icon.save(OUT / "vanpe-app-icon.png")
    splash.save(OUT / "vanpe-splash.png")

    print("generated", OUT / "icon.png")
    print("generated", OUT / "splash-icon.png")


if __name__ == "__main__":
    main()
