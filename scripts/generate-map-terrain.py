# -*- coding: utf-8 -*-
"""Derive per-cell battle-map annotations from the map art geometry.

Every one of the 60 maps is produced by scripts/generate-battle-assets.py:
a shared forest/river/cliff base plate plus deterministic chapter and
variant overlays.  This script re-runs the exact same overlay geometry,
measures which 80×80 board cells each painted feature covers, and emits
js/data/map-terrain.js — one 21×10 grid per map so the in-game water /
forest / fire / impassable markers always match the visible art.

Legend: '.' plain  'W' water  'F' forest  'R' fire/lava  '#' impassable
"""
from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageStat

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "js" / "data" / "map-terrain.js"
W, H = 1680, 800
COLS, ROWS, CELL = 21, 10, 80

# Hand-audited from assets/maps/chapter-01-forest-river-21x10.png, the base
# plate shared by all 60 maps: cliff blocks in the four corners, tree lines
# down both edges, and the rocky stream crossing row 2.  Everything else on
# the plate is open plain — it must never be marked impassable.
BASE = [
    "###...............###",
    "###...............###",
    "FFWWWWWWWWWWWWWWWWWFF",
    "FFF...............FFF",
    "FFF...............FFF",
    "FFF...............FFF",
    "FFF...............FFF",
    "FFF...............FFF",
    "###...............###",
    "###...............###",
]

VARIANTS = ("field", "boss", "hard-1", "hard-2", "hard-3", "hard-4")


def cell_of(x: float, y: float) -> tuple[int, int]:
    return min(COLS - 1, max(0, int(x // CELL))), min(ROWS - 1, max(0, int(y // CELL)))


def paint(grid: list[list[str]], x: float, y: float, code: str, over_blocked: bool = False) -> None:
    cx, cy = cell_of(x, y)
    if grid[cy][cx] != "#" or over_blocked:
        grid[cy][cx] = code


def polyline_cells(grid: list[list[str]], points: list[tuple[float, float]], code: str) -> None:
    """Mark every cell the painted centerline passes through."""
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        steps = max(2, int(math.hypot(x1 - x0, y1 - y0) / 8))
        for step in range(steps + 1):
            t = step / steps
            paint(grid, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, code)


def coverage_cells(mask: Image.Image, threshold: float) -> list[tuple[int, int]]:
    cells = []
    for cy in range(ROWS):
        for cx in range(COLS):
            box = mask.crop((cx * CELL, cy * CELL, (cx + 1) * CELL, (cy + 1) * CELL))
            if ImageStat.Stat(box).mean[0] / 255 >= threshold:
                cells.append((cx, cy))
    return cells


def chapter_overlay(grid: list[list[str]], chapter: int) -> None:
    """Same geometry as map_overlay() in generate-battle-assets.py."""
    if chapter in (3, 6, 9, 10):
        # Winding lava / energy stream across the upper battlefield.
        points = [(W * t / 18, H * (.35 + .08 * math.sin(t * .85 + chapter))) for t in range(19)]
        polyline_cells(grid, points, "R")
    elif chapter in (5, 7):
        # Three drift streams: an icy / tidal water band.
        for offset in (-36, 0, 40):
            points = [(0, H * .28 + offset)] + [(W * t / 12, H * (.27 + .04 * math.sin(t + chapter)) + offset) for t in range(1, 13)]
            polyline_cells(grid, points, "W")
    elif chapter in (4, 8):
        # Three ruin pillars: solid blockers.
        mask = Image.new("L", (W, H))
        draw = ImageDraw.Draw(mask)
        for fx in (.46, .62, .78):
            x = int(W * fx)
            draw.rectangle((x, int(H * .18), x + 42, int(H * .48)), fill=255)
        for cx, cy in coverage_cells(mask, .25):
            grid[cy][cx] = "#"
    # Chapters 1 and 2 only add faint light-grass glows: plain, no markers.


def variant_overlay(grid: list[list[str]], variant: str) -> None:
    mask = Image.new("L", (W, H))
    draw = ImageDraw.Draw(mask)
    centers: list[tuple[int, int]] = []
    if variant == "boss":
        cx, cy = int(W * .74), int(H * .48)
        draw.polygon([(cx, cy - 92), (cx + 80, cy + 52), (cx - 80, cy + 52)], fill=255)
    elif variant == "hard-1":
        centers = [(int(W * (.36 + i * .09)), int(H * (.2 + i * .1))) for i in range(6)]
    elif variant == "hard-2":
        centers = [(int(W * (.34 + i * .085)), int(H * (.2 + (i % 2) * .56))) for i in range(7)]
    elif variant == "hard-3":
        cx, cy = int(W * .64), int(H * .5)
        centers = [(int(cx + math.cos(math.tau * i / 10) * W * .18), int(cy + math.sin(math.tau * i / 10) * H * .31)) for i in range(10)]
    elif variant == "hard-4":
        cx, cy = int(W * .68), int(H * .5)
        draw.ellipse((cx - 145, cy - 145, cx + 145, cy + 145), fill=255)
    for x, y in coverage_cells(mask, .5 if variant == "hard-4" else .25):
        grid[y][x] = "#"
    for px, py in centers:
        gx, gy = cell_of(px, py)
        grid[gy][gx] = "#"


def build_grid(chapter: int, variant: str) -> list[str]:
    grid = [list(row) for row in BASE]
    chapter_overlay(grid, chapter)
    variant_overlay(grid, variant)
    return ["".join(row) for row in grid]


def main() -> None:
    data = {
        f"chapter-{chapter:02d}-{variant}": build_grid(chapter, variant)
        for chapter in range(1, 11)
        for variant in VARIANTS
    }
    rows = ",\n".join(
        f'    "{key}": [\n' + ",\n".join(f'      "{row}"' for row in grid) + "\n    ]"
        for key, grid in data.items()
    )
    OUT.write_text(
        "/* 由 scripts/generate-map-terrain.py 依 60 張美術大地圖幾何自動產生，請勿手改。\n"
        "   圖例：'.' 平原、'W' 水、'F' 森林、'R' 火焰熔岩、'#' 禁行。 */\n"
        "(function (global) {\n"
        "  'use strict';\n"
        "  global.TACTICAL_MAP_TERRAIN = Object.freeze({\n"
        f"{rows}\n"
        "  });\n"
        "}(typeof window !== 'undefined' ? window : globalThis));\n",
        encoding="utf-8",
    )
    blocked = sum(row.count("#") for grid in data.values() for row in grid)
    print(f"Wrote {OUT.relative_to(ROOT)} with {len(data)} grids ({blocked} blocked cells total).")


if __name__ == "__main__":
    main()
