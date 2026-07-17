from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "05_預覽"
OUT.mkdir(parents=True, exist_ok=True)


def checker(size, cell=16):
    image = Image.new("RGBA", size, (16, 23, 36, 255))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle((x, y, x + cell - 1, y + cell - 1), fill=(27, 38, 55, 255))
    return image


def pet_contact_sheet():
    files = sorted((ROOT / "01_幻獸").glob("*.png"))
    columns, rows = 10, 5
    cell_w, cell_h = 180, 210
    sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), (10, 16, 27))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, path in enumerate(files[:50]):
        x = (index % columns) * cell_w
        y = (index // columns) * cell_h
        tile = checker((cell_w - 12, cell_h - 34))
        with Image.open(path) as source:
            sprite = source.convert("RGBA")
            sprite.thumbnail((cell_w - 28, cell_h - 50), Image.Resampling.LANCZOS)
            px = (tile.width - sprite.width) // 2
            py = (tile.height - sprite.height) // 2
            tile.alpha_composite(sprite, (px, py))
        sheet.paste(tile.convert("RGB"), (x + 6, y + 6))
        label = path.stem[:3]
        draw.text((x + 8, y + cell_h - 23), label, fill=(231, 238, 248), font=font)
    sheet.save(OUT / "50隻幻獸總覽.jpg", quality=92)


def copy_atlas_previews():
    groups = [
        (ROOT / "02_地形" / "_圖集", "地形"),
        (ROOT / "03_道具" / "_圖集", "道具"),
        (ROOT / "04_技能" / "_圖集", "技能"),
    ]
    for folder, label in groups:
        for path in sorted(folder.glob("*.png")):
            with Image.open(path) as image:
                image.convert("RGB").save(OUT / f"{label}_{path.stem}.jpg", quality=92)


if __name__ == "__main__":
    pet_contact_sheet()
    copy_atlas_previews()
    print(f"Preview files written to: {OUT}")
