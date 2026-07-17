from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
BOSS_DIR = ROOT / "01_Boss"
MINION_DIR = ROOT / "02_專屬小兵"
PREVIEW_DIR = ROOT / "03_配對預覽"
CANVAS = 1536


def normalize_square(path: Path) -> None:
    with Image.open(path) as source:
        image = source.convert("RGBA")
    if image.size == (CANVAS, CANVAS):
        return
    if image.width > CANVAS or image.height > CANVAS:
        image.thumbnail((CANVAS, CANVAS), Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    output.alpha_composite(image, ((CANVAS - image.width) // 2, (CANVAS - image.height) // 2))
    output.save(path)


def checker(size, cell=18):
    output = Image.new("RGBA", size, (14, 21, 34, 255))
    draw = ImageDraw.Draw(output)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(27, 39, 57, 255))
    return output


def make_preview() -> None:
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    bosses = sorted(BOSS_DIR.glob("*.png"))
    minions = sorted(MINION_DIR.glob("*.png"))
    columns, rows = 5, 2
    cell_w, cell_h = 390, 430
    sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), (8, 14, 25))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, (boss_path, minion_path) in enumerate(zip(bosses, minions)):
        x = (index % columns) * cell_w
        y = (index // columns) * cell_h
        tile = checker((cell_w - 12, cell_h - 42))
        with Image.open(boss_path) as image:
            boss = image.convert("RGBA")
            boss.thumbnail((340, 340), Image.Resampling.LANCZOS)
        with Image.open(minion_path) as image:
            minion = image.convert("RGBA")
            minion.thumbnail((145, 145), Image.Resampling.LANCZOS)
        tile.alpha_composite(boss, ((tile.width - boss.width) // 2, (tile.height - boss.height) // 2))
        tile.alpha_composite(minion, (tile.width - minion.width - 8, tile.height - minion.height - 8))
        sheet.paste(tile.convert("RGB"), (x + 6, y + 6))
        draw.text((x + 10, y + cell_h - 28), f"B{index + 1:02d} + M{index + 1:02d}", fill=(236, 241, 249), font=font)
    sheet.save(PREVIEW_DIR / "10組Boss與專屬小兵總覽.jpg", quality=93)


if __name__ == "__main__":
    for image_path in sorted(BOSS_DIR.glob("*.png")) + sorted(MINION_DIR.glob("*.png")):
        normalize_square(image_path)
    make_preview()
    print("Normalized 20 images and created pair preview.")
