# -*- coding: utf-8 -*-
"""Build production battle maps and directional motion sheets from current art.

Maps: 10 chapters × field/boss/4 hard trials, fixed 21:10 canvas.
Units: every tactical pet/enemy gets a 4-column × 6-row sheet:
right-idle, right-move, right-attack, left-idle, left-move, left-attack.
"""
from __future__ import annotations

import json
import math
import os
import random
import re
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
MAP_DIR = ROOT / "assets" / "maps"
MOTION_DIR = ROOT / "assets" / "animations" / "units"
FRAME = 112
MAP_SIZE = (1680, 800)

CHAPTERS = {
    1: ("verdant", (76, 121, 57), (163, 188, 87)),
    2: ("mist", (47, 92, 74), (137, 166, 128)),
    3: ("ember", (108, 44, 25), (218, 105, 42)),
    4: ("ruins", (79, 73, 68), (165, 145, 111)),
    5: ("frost", (59, 103, 135), (181, 222, 231)),
    6: ("storm", (61, 65, 103), (194, 178, 85)),
    7: ("tide", (31, 81, 114), (70, 163, 177)),
    8: ("sky", (105, 116, 141), (232, 203, 123)),
    9: ("rift", (58, 35, 78), (142, 62, 136)),
    10: ("void", (34, 25, 50), (183, 72, 109)),
    11: ("machine", (28, 43, 49), (102, 141, 139)),
    12: ("voltage", (20, 38, 73), (66, 170, 224)),
    13: ("foundry", (73, 30, 20), (213, 89, 31)),
    14: ("prototype", (45, 42, 69), (177, 112, 220)),
    15: ("firewall", (47, 57, 76), (178, 222, 239)),
}

# Most of the established portrait pack is composed facing left. Normalize the
# source art before laying out semantic right/left rows; list genuine right-facing
# sources here so their first row is not accidentally reversed.
SOURCE_ALREADY_RIGHT = {"abyss_dragon", "abyss_god_dragon"}


def contain(image: Image.Image, size: tuple[int, int], scale: float = .9) -> Image.Image:
    image = image.convert("RGBA")
    box = image.getchannel("A").getbbox()
    if box:
        image = image.crop(box)
    target = (max(1, int(size[0] * scale)), max(1, int(size[1] * scale)))
    image.thumbnail(target, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size)
    canvas.alpha_composite(image, ((size[0] - image.width) // 2, size[1] - image.height - 4))
    return canvas


def motion_frame(base: Image.Image, row: int, frame: int) -> Image.Image:
    right = row < 3
    action = ("idle", "move", "attack")[row % 3]
    source = base if right else ImageOps.mirror(base)
    if action == "attack":
        phases = ((0, 0, 1.0, 0), (-5, 1, .96, -4), (10, -2, 1.08, 7), (2, 0, 1.02, 2))
    elif action == "move":
        phases = ((0, 1, 1.0, 0), (3, -4, .98, 2), (0, 0, 1.0, 0), (-3, -3, 1.02, -2))
    else:
        phases = ((0, 1, 1.0, 0), (0, -1, 1.012, 0), (0, -3, 1.025, 0), (0, -1, 1.012, 0))
    dx, dy, scale, angle = phases[frame]
    if not right:
        dx, angle = -dx, -angle
    work = source.rotate(angle, Image.Resampling.BICUBIC, expand=False)
    if scale != 1:
        resized = work.resize((int(FRAME * scale), int(FRAME * scale)), Image.Resampling.LANCZOS)
        work = Image.new("RGBA", (FRAME, FRAME))
        work.alpha_composite(resized, ((FRAME - resized.width) // 2, FRAME - resized.height))
    result = Image.new("RGBA", (FRAME, FRAME))
    result.alpha_composite(work, (dx, dy))
    if action == "attack" and frame in (1, 2):
        glow = result.getchannel("A").filter(ImageFilter.GaussianBlur(5))
        aura = Image.new("RGBA", result.size, (255, 220, 120, 0)); aura.putalpha(glow.point(lambda a: a // 5))
        result = Image.alpha_composite(aura, result)
    return result


def parse_profiles() -> list[tuple[str, Path]]:
    """Read runtime art paths without duplicating game data in this generator."""
    # The three pet data packs use different declaration styles, while the
    # runtime contract always resolves to this exact directory convention.
    pet_root = ROOT / "assets" / "pets"
    pets = [(folder.name, folder / "evolution" / "stage_1.png") for folder in sorted(pet_root.iterdir()) if folder.is_dir()]
    pack_root = ROOT / "assets" / "pack"
    pets.extend((art.stem, art) for art in sorted(pack_root.glob("*.png")))

    enemy_source = (ROOT / "js" / "data" / "tactical-enemies.js").read_text(encoding="utf-8")
    enemy_ids = re.findall(r"enemy\(['\"]([a-z0-9_]+)['\"]", enemy_source)
    # Chapter 12+ uses compact spec arrays so visual IDs are not all literal
    # enemy(...) calls. Approved four-direction sources are the authoritative
    # asset list for those entries.
    for source in (ROOT / "assets" / "animations" / "directional" / "sources").glob("*-four-direction-reference-v*-alpha.png"):
        match = re.match(r"(.+)-four-direction-reference-v\d+-alpha\.png$", source.name)
        if match:
            enemy_ids.append(match.group(1))
    enemies = [(enemy_id, ROOT / "assets" / "enemies" / f"{enemy_id}.png") for enemy_id in enemy_ids]
    seen = set()
    return [(unit_id, path) for unit_id, path in pets + enemies if path.exists() and not (unit_id in seen or seen.add(unit_id))]


def generate_motion_sheets() -> dict[str, dict[str, str | int]]:
    MOTION_DIR.mkdir(parents=True, exist_ok=True)
    # Remove only stale files produced by the earlier PNG version of this generator.
    for stale in MOTION_DIR.glob("*-motion-sheet.png"):
        stale.unlink()
    manifest = {}
    for unit_id, path in parse_profiles():
        base = contain(Image.open(path), (FRAME, FRAME), .9)
        if unit_id not in SOURCE_ALREADY_RIGHT:
            base = ImageOps.mirror(base)
        sheet = Image.new("RGBA", (FRAME * 4, FRAME * 6))
        for row in range(6):
            for frame in range(4):
                sheet.alpha_composite(motion_frame(base, row, frame), (frame * FRAME, row * FRAME))
        filename = f"{unit_id}-motion-sheet.webp"
        sheet.save(MOTION_DIR / filename, "WEBP", quality=80, method=4, exact=True)
        manifest[unit_id] = {
            "file": f"assets/animations/units/{filename}", "columns": 4, "rows": 6, "frame": FRAME,
            "rowsOrder": ["idle-right", "move-right", "attack-right", "idle-left", "move-left", "attack-left"]
        }
    (MOTION_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def tint_map(base: Image.Image, dark: tuple[int, int, int], light: tuple[int, int, int]) -> Image.Image:
    gray = ImageOps.autocontrast(base.convert("L"), cutoff=1)
    colored = ImageOps.colorize(gray, dark, light).convert("RGBA")
    return ImageEnhance.Color(colored).enhance(1.16)


def map_overlay(image: Image.Image, chapter: int, variant: str) -> Image.Image:
    draw = ImageDraw.Draw(image, "RGBA")
    w, h = image.size
    accent = CHAPTERS[chapter][2]
    rng = random.Random(chapter * 100 + (0 if variant == "field" else 9))

    # Chapter identity is carried by palette and lighting. Normal fields stay
    # clean so no decorative mark can be mistaken for a gameplay tile.

    if variant == "boss":
        cx, cy = int(w * .74), int(h * .48)
        for radius, alpha, width in ((176, 26, 7), (126, 34, 5), (78, 42, 4)):
            draw.ellipse((cx-radius, cy-radius, cx+radius, cy+radius), outline=accent + (alpha,), width=width)
        for index in range(8):
            angle = math.tau * index / 8
            x, y = int(cx + math.cos(angle) * 151), int(cy + math.sin(angle) * 151)
            draw.ellipse((x-7, y-4, x+7, y+4), fill=accent + (46,))
    elif variant.startswith("hard-"):
        trial = int(variant[-1])
        rock = tuple(max(12, int(channel * .28)) for channel in accent)
        edge = tuple(min(235, int(channel * 1.12)) for channel in accent)

        def stone(x: int, y: int, radius: int = 24) -> None:
            points = []
            for index in range(8):
                angle = math.tau * index / 8
                jitter = radius * rng.uniform(.78, 1.16)
                points.append((int(x + math.cos(angle) * jitter), int(y + math.sin(angle) * jitter * .72)))
            draw.ellipse((x-radius, y+radius//3, x+radius, y+radius), fill=(7, 8, 13, 70))
            draw.polygon(points, fill=rock + (205,), outline=edge + (135,))
            draw.line((x-radius//2, y-radius//4, x+radius//3, y-radius//2), fill=(255, 244, 212, 42), width=3)

        # Four trials retain distinct tactical rhythms using natural rocks and
        # ruined stones rather than opaque diamonds, bars or target symbols.
        if trial == 1:
            for index in range(6):
                x = int(w * (.36 + index * .09)); y = int(h * (.2 + index * .1))
                stone(x, y, 20 + index % 3 * 3)
        elif trial == 2:
            for index in range(7):
                x = int(w * (.34 + index * .085)); y = int(h * (.2 + (index % 2) * .56))
                stone(x, y, 22)
        elif trial == 3:
            cx, cy = int(w * .64), int(h * .5)
            for index in range(10):
                angle = math.tau * index / 10
                x, y = int(cx + math.cos(angle) * w * .18), int(cy + math.sin(angle) * h * .31)
                stone(x, y, 19 + index % 2 * 4)
        else:
            cx, cy = int(w * .68), int(h * .5)
            for index in range(8):
                angle = math.tau * index / 8
                x, y = int(cx + math.cos(angle) * 112), int(cy + math.sin(angle) * 112)
                stone(x, y, 21)
            draw.ellipse((cx-118, cy-86, cx+118, cy+86), outline=accent + (42,), width=5)
    return image.filter(ImageFilter.GaussianBlur(.18))


def chapter_scene(chapter: int) -> Image.Image:
    """Paint a chapter-native battlefield rather than recolouring one shared map.

    The play space remains deliberately readable through a low-detail central lane;
    chapter landmarks live at the edges so they cannot be confused with tiles.
    """
    _, dark, light = CHAPTERS[chapter]
    rng = random.Random(8100 + chapter)
    image = Image.new("RGB", MAP_SIZE, dark)
    draw = ImageDraw.Draw(image, "RGBA")
    w, h = MAP_SIZE
    # Atmospheric depth and a unique, broad tactical lane for every chapter.
    for band in range(18):
        y0, y1 = band * h // 18, (band + 1) * h // 18
        mix = band / 17
        color = tuple(round(dark[i] * (1 - mix) + light[i] * mix) for i in range(3))
        draw.rectangle((0, y0, w, y1), fill=color + (42,))
    lane_y = (.56, .44, .53, .47, .52, .45, .57, .43, .54, .48, .51, .46, .55, .49, .52)[chapter - 1]
    lane = [(0, int(h * lane_y + math.sin(x / w * math.tau * (chapter % 3 + 1)) * h * .035))
            for x in range(0, w + 1, 70)]
    lane += [(w, h), (0, h)]
    draw.polygon(lane, fill=(236, 225, 182, 26))
    # Distinct landmark vocabulary by chapter: forest, marsh, lava, ruins, ice,
    # storm, coast, sky islands, crystal rift and void citadel.
    if chapter == 1:
        for _ in range(54):
            x, y = rng.randrange(w), rng.choice([rng.randrange(0, 250), rng.randrange(600, h)])
            r = rng.randrange(25, 62); draw.ellipse((x-r, y-r, x+r, y+r), fill=(31, 78, 35, 210), outline=(150, 203, 92, 105), width=3)
    elif chapter == 2:
        for _ in range(28):
            x, y = rng.randrange(w), rng.randrange(h); r = rng.randrange(30, 88)
            draw.ellipse((x-r, y-r//2, x+r, y+r//2), fill=(174, 226, 209, 42))
        for _ in range(18):
            x, y = rng.randrange(w), rng.randrange(h); draw.ellipse((x-24, y-10, x+24, y+10), fill=(26, 72, 62, 150))
    elif chapter == 3:
        for _ in range(7):
            x = (index := _) * w // 6 - 60; draw.polygon([(x, h), (x+145, h), (x+80, 0)], fill=(68, 23, 18, 190))
        for _ in range(15):
            x, y = rng.randrange(w), rng.randrange(h); draw.line((x, y, x + rng.randrange(-100, 100), y + rng.randrange(30, 100)), fill=(255, 113, 32, 145), width=7)
    elif chapter == 4:
        for _ in range(20):
            x, y = rng.randrange(w), rng.choice([rng.randrange(0, 235), rng.randrange(590, h)])
            draw.rectangle((x, y, x+48, y+78), fill=(83, 74, 64, 220), outline=(205, 180, 130, 100), width=3)
    elif chapter == 5:
        for _ in range(36):
            x, y = rng.randrange(w), rng.randrange(h); r = rng.randrange(18, 58)
            draw.polygon([(x, y-r), (x+r//2, y), (x, y+r), (x-r//2, y)], fill=(210, 247, 255, 120), outline=(255, 255, 255, 120))
    elif chapter == 6:
        for _ in range(11):
            x = rng.randrange(w); draw.line((x, 0, x+rng.randrange(-80, 80), h), fill=(225, 211, 106, 105), width=4)
        for _ in range(18):
            x, y = rng.randrange(w), rng.randrange(h); draw.ellipse((x-18, y-10, x+18, y+10), fill=(35, 39, 74, 115))
    elif chapter == 7:
        for _ in range(12):
            y = 70 + _ * 58; draw.arc((-120, y-45, w+130, y+65), 188, 352, fill=(125, 230, 235, 110), width=8)
        for _ in range(16):
            x, y = rng.randrange(w), rng.choice([rng.randrange(0, 210), rng.randrange(620, h)]); draw.ellipse((x-38, y-20, x+38, y+20), fill=(210, 194, 121, 140))
    elif chapter == 8:
        for _ in range(16):
            x, y = rng.randrange(w), rng.choice([rng.randrange(0, 240), rng.randrange(580, h)]); r = rng.randrange(26, 64)
            draw.ellipse((x-r, y-r//2, x+r, y+r//2), fill=(246, 225, 163, 145), outline=(255, 248, 218, 100), width=2)
    elif chapter == 9:
        for _ in range(24):
            x, y = rng.randrange(w), rng.randrange(h); r = rng.randrange(16, 54)
            draw.polygon([(x, y-r), (x+r, y), (x, y+r), (x-r, y)], fill=(170, 76, 220, 125), outline=(245, 175, 255, 95))
    elif chapter == 10:
        for _ in range(32):
            x, y = rng.randrange(w), rng.randrange(h); r = rng.randrange(8, 28)
            draw.ellipse((x-r, y-r, x+r, y+r), fill=(230, 104, 170, 130))
        for x in range(60, w, 190): draw.polygon([(x, 0), (x+80, 0), (x+36, 190)], fill=(16, 11, 29, 190))
    else:
        # Chapter 11: abandoned rail yard and autonomous factory perimeter.
        for y in (105, 700):
            draw.line((0, y, w, y - 26), fill=(122, 158, 160, 115), width=9)
            draw.line((0, y + 26, w, y), fill=(67, 92, 96, 155), width=9)
        for _ in range(22):
            x = rng.randrange(w); y = rng.choice([rng.randrange(0, 245), rng.randrange(590, h)])
            draw.rectangle((x, y, x + rng.randrange(28, 75), y + rng.randrange(18, 48)), fill=(75, 89, 89, 205), outline=(190, 122, 62, 115), width=3)
        for _ in range(14):
            x, y = rng.randrange(w), rng.randrange(h)
            draw.ellipse((x - 12, y - 12, x + 12, y + 12), fill=(72, 221, 231, 72))
    return image.filter(ImageFilter.GaussianBlur(.35))


def generate_maps() -> None:
    MAP_DIR.mkdir(parents=True, exist_ok=True)
    for stale in MAP_DIR.glob("chapter-??-hard-21x10.jpg"):
        stale.unlink()
    for chapter, (_, dark, light) in CHAPTERS.items():
        base = chapter_scene(chapter)
        for variant in ("field", "boss", "hard-1", "hard-2", "hard-3", "hard-4"):
            work = base.copy()
            if variant == "boss":
                work = ImageEnhance.Brightness(work).enhance(.72)
                work = ImageEnhance.Contrast(work).enhance(1.18)
            elif variant.startswith("hard-"):
                trial = int(variant[-1])
                work = ImageEnhance.Brightness(work).enhance(.69 - trial * .035)
                work = ImageEnhance.Contrast(work).enhance(1.22 + trial * .035)
            work = map_overlay(work, chapter, variant).convert("RGB")
            work.save(MAP_DIR / f"chapter-{chapter:02d}-{variant}-21x10.jpg", quality=86, optimize=True, progressive=True)


def main() -> None:
    generate_maps()
    manifest = generate_motion_sheets()
    print(f"Generated 60 maps and {len(manifest)} directional motion sheets.")


if __name__ == "__main__":
    main()
