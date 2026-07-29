"""Classify the rendered 21x10 maps into gameplay terrain.

The source JPG is authoritative: every cell is sampled from its inner area and
classified from hue distribution, relative luminance and texture.  The output
also contains review overlays and connectivity validation, so changing map art
cannot silently leave stale gameplay terrain behind.
"""

from __future__ import annotations

import colorsys
import heapq
import json
import statistics
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageStat

ROOT = Path(__file__).resolve().parents[1]
MAPS = ROOT / "assets" / "maps"
OUTPUT = ROOT / "js" / "data" / "map-terrain.js"
PREVIEWS = ROOT / "scratch" / "map-terrain-previews"
AUDIT_IMAGE = ROOT / "docs" / "地形分類抽查對照.jpg"
COLS, ROWS = 21, 10
CELL_W, CELL_H = 80, 80
CHAPTER_SPECS = {**{chapter: (10, 4) for chapter in range(1, 12)}, **{chapter: (6, 3) for chapter in range(12, 21)}}
WALKABLE = {".", "W", "F", "R"}

# Artwork-specific corrections belong here, never in tactical-content.js.
# Entries use zero-based x/y cells and are intentionally small and reviewable.
OVERRIDES: dict[str, dict[tuple[int, int], str]] = {
    "chapter-01-field": {(4, 6): ".", (5, 6): ".", (6, 6): "."},
}

# Deployment and enemy anchor areas must never become blocked from dark artwork.
SAFE_CELLS = {
    *((x, y) for y in range(6, 10) for x in range(3, 9)),
    (9, 9),
    # 5×5 Boss 會以 x=16～20 佔滿棋盤最右側；第 21 格（x=20）
    # 也必須保持安全，否則首領視覺會壓在禁行設施上。
    *((x, y) for y in range(1, 9) for x in range(16, 21)),
}


@dataclass(frozen=True)
class CellStats:
    hue: float
    saturation: float
    value: float
    texture: float
    blue: float
    green: float
    red: float


def cell_stats(image: Image.Image, x: int, y: int) -> CellStats:
    margin_x, margin_y = 12, 12
    crop = image.crop((
        x * CELL_W + margin_x,
        y * CELL_H + margin_y,
        (x + 1) * CELL_W - margin_x,
        (y + 1) * CELL_H - margin_y,
    )).resize((16, 16), Image.Resampling.LANCZOS)
    pixels = list(crop.get_flattened_data())
    hsv = [colorsys.rgb_to_hsv(r / 255, g / 255, b / 255) for r, g, b in pixels]
    count = len(hsv)
    hue = statistics.fmean(item[0] for item in hsv)
    saturation = statistics.fmean(item[1] for item in hsv)
    value = statistics.fmean(item[2] for item in hsv)
    texture = statistics.fmean(ImageStat.Stat(crop).stddev) / 255
    blue = sum(0.48 <= h <= 0.68 and s >= 0.22 for h, s, _ in hsv) / count
    green = sum(0.18 <= h <= 0.47 and s >= 0.20 for h, s, _ in hsv) / count
    red = sum((h <= 0.12 or h >= 0.94) and s >= 0.30 for h, s, _ in hsv) / count
    return CellStats(hue, saturation, value, texture, blue, green, red)


def classify_map(image: Image.Image) -> list[list[str]]:
    stats = [[cell_stats(image, x, y) for x in range(COLS)] for y in range(ROWS)]
    flat = [item for row in stats for item in row]
    med_v = statistics.median(item.value for item in flat)
    med_s = max(0.05, statistics.median(item.saturation for item in flat))
    med_t = max(0.01, statistics.median(item.texture for item in flat))
    grid: list[list[str]] = []
    for y, row in enumerate(stats):
        output_row: list[str] = []
        for x, item in enumerate(row):
            dark = item.value < med_v * 0.73
            rough = item.texture > med_t * 1.08
            saturated = item.saturation > med_s * 1.08
            bright = item.value > med_v * 1.07
            code = "."
            if (x, y) not in SAFE_CELLS and dark and rough:
                code = "#"
            elif item.blue >= 0.56 and (bright or saturated) and item.texture < med_t * 1.30:
                code = "W"
            elif item.red >= 0.60 and (bright or saturated) and item.texture > med_t * 0.72:
                code = "R"
            elif item.green >= 0.58 and item.value < med_v * 0.91 and rough:
                code = "F"
            output_row.append(code)
        grid.append(output_row)
    # Remove isolated one-cell noise created by compression and promote only
    # strongly supported holes inside a visible terrain patch.
    for _ in range(2):
        updated = [row[:] for row in grid]
        for y in range(ROWS):
            for x in range(COLS):
                neighbors = [grid[ny][nx] for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)) if 0 <= nx < COLS and 0 <= ny < ROWS]
                code = grid[y][x]
                if code in "WFR" and neighbors.count(code) == 0:
                    updated[y][x] = "."
                elif code == ".":
                    for candidate in "WFR":
                        if neighbors.count(candidate) >= 3:
                            updated[y][x] = candidate
                            break
        grid = updated
    return grid


def apply_overrides(key: str, grid: list[list[str]]) -> None:
    for (x, y), code in OVERRIDES.get(key, {}).items():
        grid[y][x] = code
    for x, y in SAFE_CELLS:
        if 0 <= x < COLS and 0 <= y < ROWS and grid[y][x] == "#":
            grid[y][x] = "."
    chapter = int(key.split("-")[1])
    if "-story-" in key and chapter not in {4, 8}:
        for y in range(2, 8):
            for x in range(3, 18):
                if grid[y][x] == "#":
                    grid[y][x] = "."


def reachable(grid: list[list[str]], start: tuple[int, int]) -> set[tuple[int, int]]:
    seen = {start}
    queue = [start]
    while queue:
        x, y = queue.pop(0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            point = (x + dx, y + dy)
            if 0 <= point[0] < COLS and 0 <= point[1] < ROWS and point not in seen and grid[point[1]][point[0]] in WALKABLE:
                seen.add(point)
                queue.append(point)
    return seen


def ensure_connected(grid: list[list[str]]) -> bool:
    """Carve the fewest dark cells needed between deployment and enemy areas."""
    start, goal = (6, 7), (17, 5)
    if goal in reachable(grid, start):
        return False
    heap = [(0, start)]
    previous: dict[tuple[int, int], tuple[int, int]] = {}
    costs = {start: 0}
    while heap:
        cost, point = heapq.heappop(heap)
        if point == goal:
            break
        if cost != costs[point]:
            continue
        x, y = point
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nxt = (x + dx, y + dy)
            if not (0 <= nxt[0] < COLS and 0 <= nxt[1] < ROWS):
                continue
            next_cost = cost + (8 if grid[nxt[1]][nxt[0]] == "#" else 1)
            if next_cost < costs.get(nxt, 10**9):
                costs[nxt] = next_cost
                previous[nxt] = point
                heapq.heappush(heap, (next_cost, nxt))
    point = goal
    while point != start:
        if grid[point[1]][point[0]] == "#":
            grid[point[1]][point[0]] = "."
        point = previous[point]
    if goal not in reachable(grid, start):
        raise RuntimeError("terrain connectivity repair failed")
    return True


COLORS = {
    "W": (39, 155, 255, 115),
    "F": (54, 180, 88, 115),
    "R": (255, 84, 35, 125),
    "#": (16, 12, 22, 170),
}


def preview(image: Image.Image, grid: list[list[str]], key: str) -> Image.Image:
    result = image.convert("RGBA")
    overlay = Image.new("RGBA", result.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    font = ImageFont.load_default(size=18)
    for y, row in enumerate(grid):
        for x, code in enumerate(row):
            box = (x * CELL_W, y * CELL_H, (x + 1) * CELL_W - 1, (y + 1) * CELL_H - 1)
            draw.rectangle(box, fill=COLORS.get(code, (0, 0, 0, 0)), outline=(255, 255, 255, 45), width=1)
            if code != ".":
                draw.text((box[0] + 5, box[1] + 4), code, fill=(255, 255, 255, 230), font=font, stroke_width=2, stroke_fill=(0, 0, 0, 180))
    draw.rectangle((0, 0, 430, 32), fill=(0, 0, 0, 190))
    draw.text((8, 7), key + "  W=water F=forest R=lava #=blocked", fill="white")
    return Image.alpha_composite(result, overlay).convert("RGB")


def write_audit(examples: list[tuple[str, Image.Image, Image.Image]]) -> None:
    thumb_w, thumb_h = 630, 300
    canvas = Image.new("RGB", (thumb_w * 2, thumb_h * len(examples)), "#10131a")
    draw = ImageDraw.Draw(canvas)
    for index, (key, source, overlay) in enumerate(examples):
        for column, image in enumerate((source, overlay)):
            thumb = image.copy()
            thumb.thumbnail((thumb_w, thumb_h - 24), Image.Resampling.LANCZOS)
            canvas.paste(thumb, (column * thumb_w, index * thumb_h + 24))
        draw.text((8, index * thumb_h + 5), f"{key} - original", fill="white")
        draw.text((thumb_w + 8, index * thumb_h + 5), f"{key} - classified overlay", fill="white")
    AUDIT_IMAGE.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(AUDIT_IMAGE, quality=88, optimize=True)


def main() -> None:
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    maps: dict[str, list[str]] = {}
    audit: list[tuple[str, Image.Image, Image.Image]] = []
    repaired = 0
    audit_keys = {f"chapter-{chapter:02d}-story-01" for chapter in range(1, 21)}
    for chapter, (main_count, hard_count) in CHAPTER_SPECS.items():
        variants = [f"story-{index:02d}" for index in range(1, main_count + 1)]
        variants += ["boss"] + [f"hard-{index}" for index in range(1, hard_count + 1)]
        for variant in variants:
            key = f"chapter-{chapter:02d}-{variant}"
            source_path = MAPS / f"{key}-21x10.jpg"
            if not source_path.exists():
                raise FileNotFoundError(source_path)
            source = Image.open(source_path).convert("RGB")
            if source.size != (COLS * CELL_W, ROWS * CELL_H):
                raise ValueError(f"{source_path.name}: expected 1680x800, got {source.size}")
            grid = classify_map(source)
            apply_overrides(key, grid)
            repaired += int(ensure_connected(grid))
            if (17, 5) not in reachable(grid, (6, 7)):
                raise RuntimeError(f"{key}: spawn-to-enemy path is disconnected")
            overlay = preview(source, grid, key)
            overlay.save(PREVIEWS / f"{key}.jpg", quality=86, optimize=True)
            if key in audit_keys:
                audit.append((key, source, overlay))
            maps[key] = ["".join(row) for row in grid]
    payload = json.dumps(maps, ensure_ascii=False, indent=2)
    OUTPUT.write_text(
        "/* Generated by scripts/generate-map-terrain.py from the actual long-scroll map JPGs. */\n"
        f"window.TACTICAL_MAP_TERRAIN = Object.freeze({payload});\n",
        encoding="utf-8",
    )
    write_audit(audit)
    print(f"Generated {len(maps)} terrain grids; {repaired} paths repaired")
    print(f"Review overlays: {PREVIEWS}")
    print(f"Long-scroll audit: {AUDIT_IMAGE}")


if __name__ == "__main__":
    main()
