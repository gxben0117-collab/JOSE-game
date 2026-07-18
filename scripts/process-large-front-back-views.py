# -*- coding: utf-8 -*-
"""Cut the approved large-beast front/back atlases into transparent views."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
VIEW_DIR = ROOT / "assets" / "animations" / "directional" / "views"
SOURCE_DIR = VIEW_DIR / "sources"

GROUPS = (
    ("blazing_dragon", "crimson_dragon", "emerald_dragon", "tsunami_dragon", "frost_leviathan", "volcanic_titan"),
    ("ancient_treant", "flame_emperor", "forest_god", "sea_emperor", "flame_god_lion", "emerald_god_dragon"),
    ("abyss_god_dragon", "sea_god_beast", "jade_qilin", "solar_phoenix", "eclipse_dragon", "void_leviathan"),
    ("gold_qilin", "kiln_rhinoceros", "fern_ceratops", "mushroom_bison", "amber_antler_moose", "brine_crocodile"),
    ("aurora_narwhal", "cathedral_elephant", "crown_unicorn", "obsidian_gorilla", "abyss_mammoth"),
)


def remove_magenta(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, _ = pixels[x, y]
            dominance = min(r - g, b - g)
            if r > 185 and b > 150 and dominance > 45:
                alpha = max(0, min(255, 255 - (dominance - 45) * 7))
                pixels[x, y] = (r, g, b, alpha)
    return image


def keep_main_components(image: Image.Image) -> Image.Image:
    """Discard tiny neighbouring-cell spill without deleting detached effects."""
    alpha = image.getchannel("A")
    px = alpha.load()
    seen: set[tuple[int, int]] = set()
    components: list[list[tuple[int, int]]] = []
    for y in range(image.height):
        for x in range(image.width):
            if px[x, y] < 40 or (x, y) in seen:
                continue
            queue = deque([(x, y)])
            seen.add((x, y))
            component: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                component.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < image.width and 0 <= ny < image.height and px[nx, ny] >= 40 and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        queue.append((nx, ny))
            components.append(component)
    if not components:
        return image
    components.sort(key=len, reverse=True)
    threshold = max(24, len(components[0]) // 250)
    main = components[0]
    main_box = (
        min(point[0] for point in main) - 24,
        min(point[1] for point in main) - 24,
        max(point[0] for point in main) + 24,
        max(point[1] for point in main) + 24,
    )
    def belongs(component: list[tuple[int, int]]) -> bool:
        if len(component) < threshold:
            return False
        left, top = min(point[0] for point in component), min(point[1] for point in component)
        right, bottom = max(point[0] for point in component), max(point[1] for point in component)
        return not (right < main_box[0] or left > main_box[2] or bottom < main_box[1] or top > main_box[3])
    keep = {point for component in components if belongs(component) for point in component}
    output_alpha = alpha.copy()
    out = output_alpha.load()
    for y in range(image.height):
        for x in range(image.width):
            if px[x, y] >= 40 and (x, y) not in keep:
                out[x, y] = 0
    image.putalpha(output_alpha)
    return image


def normalize(cell: Image.Image) -> Image.Image:
    cell = keep_main_components(remove_magenta(cell))
    box = cell.getchannel("A").getbbox()
    subject = cell.crop(box) if box else cell
    subject.thumbnail((480, 480), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (512, 512))
    canvas.alpha_composite(subject, ((512 - subject.width) // 2, 500 - subject.height))
    return canvas


def main() -> None:
    VIEW_DIR.mkdir(parents=True, exist_ok=True)
    count = 0
    for group_index, ids in enumerate(GROUPS, 1):
        source = Image.open(SOURCE_DIR / f"group-{group_index}-front-back-source.png").convert("RGBA")
        for index, unit_id in enumerate(ids):
            x0 = round(source.width * index / len(ids))
            x1 = round(source.width * (index + 1) / len(ids))
            for row, view in enumerate(("front", "back")):
                y0 = round(source.height * row / 2)
                y1 = round(source.height * (row + 1) / 2)
                normalize(source.crop((x0 + 10, y0 + 6, x1 - 10, y1 - 6))).save(VIEW_DIR / f"{unit_id}-{view}.png", "PNG", compress_level=7)
                count += 1
    print(f"Built {count} transparent authored front/back views for {len(sum(GROUPS, ()))} large beasts.")


if __name__ == "__main__":
    main()
