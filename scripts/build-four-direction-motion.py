# -*- coding: utf-8 -*-
"""Build transparent four-direction motion frames from approved AI reference grids.

Reference grid: 4 columns (down/right/up/left) × 3 rows (idle/move/attack).
Runtime sheet: 6 animation frames × 12 semantic rows, each frame 112×112.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "assets" / "animations" / "directional" / "sources"
OUTPUT_DIR = ROOT / "assets" / "animations" / "directional"
FRAME_DIR = OUTPUT_DIR / "frames"
VIEW_DIR = OUTPUT_DIR / "views"
LEGACY_DIR = ROOT / "assets" / "animations" / "units"
EVOLUTION_ROOT = ROOT / "assets" / "pets"
FRAME = 112
EXPORT_SOURCE_FRAMES = os.environ.get("JOSE_EXPORT_SOURCE_FRAMES") == "1"
MIN_ANIMATION_FRAMES = 1
MAX_ANIMATION_FRAMES = 12
# Production character art uses eight frames. Each action can independently
# move anywhere from 1 to 12; the sheet uses the largest configured row width.
ACTION_ANIMATIONS = {
    "idle": {"frameCount": 8, "fps": 8, "loop": True, "hitFrame": None},
    "move": {"frameCount": 8, "fps": 12, "loop": True, "hitFrame": None},
    "attack": {"frameCount": 8, "fps": 14, "loop": False, "hitFrame": 6},
    "hit": {"frameCount": 8, "fps": 16, "loop": False, "hitFrame": 2},
    "victory": {"frameCount": 8, "fps": 8, "loop": True, "hitFrame": None},
    "death": {"frameCount": 8, "fps": 12, "loop": False, "hitFrame": None},
}
if any(not MIN_ANIMATION_FRAMES <= spec["frameCount"] <= MAX_ANIMATION_FRAMES for spec in ACTION_ANIMATIONS.values()):
    raise ValueError("Each animation action must contain between 1 and 12 frames.")
SHEET_COLUMNS = max(spec["frameCount"] for spec in ACTION_ANIMATIONS.values())
SAFE_MARGIN = 3
DIRECTIONS = ("down", "right", "up", "left")
ACTIONS = ("idle", "move", "attack", "hit", "victory", "death")
SIZE2_IDS = {
    "blazing_dragon", "crimson_dragon", "emerald_dragon", "tsunami_dragon", "frost_leviathan",
    "volcanic_titan", "ancient_treant", "flame_emperor", "forest_god", "sea_emperor",
    "flame_god_lion", "emerald_god_dragon", "abyss_god_dragon", "sea_god_beast", "jade_qilin",
    "solar_phoenix", "eclipse_dragon", "void_leviathan", "gold_qilin", "kiln_rhinoceros",
    "fern_ceratops", "mushroom_bison", "amber_antler_moose", "brine_crocodile", "aurora_narwhal",
    "cathedral_elephant", "crown_unicorn", "obsidian_gorilla", "abyss_mammoth",
}
# Portraits whose head/snout is authored toward screen-right. Front-facing
# silhouettes are intentionally omitted because mirroring does not change their
# readable heading. This list is based on visual inspection of the source pack.
SOURCE_ALREADY_RIGHT = {
    "abyss_dragon", "crimson_dragon", "emerald_dragon", "jade_qilin", "kiln_rhinoceros", "fern_ceratops",
    "mushroom_bison", "amber_antler_moose", "brine_crocodile", "aurora_narwhal",
    "cathedral_elephant", "crown_unicorn", "abyss_mammoth",
}
# 這三張 AI 參考圖的側面欄位是依「角色看向畫面中央」構圖，
# 實際內容與提示標籤相反，因此合圖時交換第 2、4 欄。
# Some reference grids are laid out from the viewer's perspective rather than
# the character's stated facing direction.  These units were verified in the
# live battle: their visible side must be swapped so a rightward move/attack
# points right on the board.
SWAPPED_SIDE_UNITS = {"fire_lion", "fire_fox", "leaf_ear_rabbit", "rotcap_rootling", "venom_mantis"}


def contain(image: Image.Image, scale: float = .93) -> Image.Image:
    image = image.convert("RGBA")
    # Chroma removal keeps a soft antialias fringe; discard near-transparent
    # background residue so attack glows cannot reveal the original panel box.
    alpha = image.getchannel("A").point(lambda value: 0 if value < 64 else value)
    image.putalpha(alpha)
    box = image.getchannel("A").getbbox()
    if box:
        image = image.crop(box)
    target = max(1, int(FRAME * scale))
    image.thumbnail((target, target), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (FRAME, FRAME))
    canvas.alpha_composite(image, ((FRAME - image.width) // 2, FRAME - image.height - 3))
    return canvas


def animate(base: Image.Image, action: str, direction: str, frame: int, frame_count: int = 6) -> Image.Image:
    direction_vector = {"down": (0, 1), "right": (1, 0), "up": (0, -1), "left": (-1, 0)}[direction]
    if action == "idle":
        phases = ((0, 1, 1.0), (0, 0, 1.008), (0, -1, 1.016), (0, -2, 1.025), (0, -1, 1.016), (0, 0, 1.008))
    elif action == "move":
        phases = ((-1, 1, 1.0), (1, -2, .99), (2, -4, .98), (0, 0, 1.0), (-2, -3, 1.01), (-1, 0, 1.005))
    elif action == "attack":
        phases = ((-2, 1, .98), (-5, 1, .95), (-7, 0, .94), (8, -1, 1.08), (4, 0, 1.04), (0, 1, 1.0))
    elif action == "hit":
        phases = ((0, 0, 1.0), (-2, 0, 1.02), (3, 1, .96), (-3, 1, 1.0), (1, 0, .99), (0, 1, 1.0))
    elif action == "victory":
        phases = ((0, 1, 1.0), (0, -3, 1.03), (0, -6, 1.06), (0, -4, 1.04), (0, -2, 1.02), (0, 1, 1.0))
    else:  # death
        phases = ((0, 1, 1.0), (-1, 2, .99), (1, 5, .96), (-2, 10, .91), (2, 17, .84), (0, 25, .76))
    phase_index = 0 if frame_count <= 1 else round(frame * (len(phases) - 1) / (frame_count - 1))
    phase_x, phase_y, scale = phases[phase_index]
    if action in ("attack", "hit"):
        dx, dy = direction_vector[0] * phase_x, direction_vector[1] * phase_x + phase_y
    elif direction in ("left", "right"):
        dx, dy = phase_x, phase_y
    else:
        dx, dy = phase_x // 2, phase_y
    # Transform only the visible beast instead of scaling the full 112px canvas.
    # Scaling and translating the full canvas could push opaque pixels outside
    # the frame, visibly slicing heads, tails and attack effects at its edges.
    alpha_box = base.getchannel("A").getbbox()
    work = base.crop(alpha_box) if alpha_box else base
    if scale != 1:
        work = work.resize(
            (max(1, round(work.width * scale)), max(1, round(work.height * scale))),
            Image.Resampling.LANCZOS,
        )
    maximum = FRAME - SAFE_MARGIN * 2
    if work.width > maximum or work.height > maximum:
        work.thumbnail((maximum, maximum), Image.Resampling.LANCZOS)
    target_x = (FRAME - work.width) // 2 + dx
    target_y = FRAME - work.height - SAFE_MARGIN + dy
    target_x = min(max(SAFE_MARGIN, target_x), FRAME - SAFE_MARGIN - work.width)
    target_y = min(max(SAFE_MARGIN, target_y), FRAME - SAFE_MARGIN - work.height)
    result = Image.new("RGBA", (FRAME, FRAME))
    result.alpha_composite(work, (target_x, target_y))
    return result


def save_frame(frame: Image.Image, path: Path) -> None:
    # Atlases are the production asset.  Individual PNGs are optional source
    # exports because writing tens of thousands of duplicate files makes both
    # Git and static deployments unnecessarily heavy.
    if EXPORT_SOURCE_FRAMES:
        frame.save(path, "PNG", compress_level=6)


def build_reference(unit_id: str, source_path: Path) -> dict[str, object]:
    source = Image.open(source_path).convert("RGBA")
    FRAME_DIR.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGBA", (FRAME * SHEET_COLUMNS, FRAME * len(DIRECTIONS) * len(ACTIONS)))
    row_order: list[str] = []
    for direction_index, direction in enumerate(DIRECTIONS):
        source_column = ({"right": 3, "left": 1}.get(direction, direction_index)
                         if unit_id in SWAPPED_SIDE_UNITS else direction_index)
        for action_index, action in enumerate(ACTIONS):
            source_action_index = {"idle": 0, "move": 1, "attack": 2, "hit": 0, "victory": 0, "death": 0}[action]
            x0 = round(source.width * source_column / 4) + 4
            x1 = round(source.width * (source_column + 1) / 4) - 4
            y0 = round(source.height * source_action_index / 3) + 4
            y1 = round(source.height * (source_action_index + 1) / 3) - 4
            base = contain(source.crop((x0, y0, x1, y1)))
            row = direction_index * len(ACTIONS) + action_index
            row_order.append(f"{action}-{direction}")
            frame_count = ACTION_ANIMATIONS[action]["frameCount"]
            for frame_index in range(frame_count):
                frame = animate(base, action, direction, frame_index, frame_count)
                sheet.alpha_composite(frame, (frame_index * FRAME, row * FRAME))
                save_frame(frame, FRAME_DIR / f"{unit_id}-{action}-{direction}-frame_{frame_index + 1:02d}.png")
    filename = f"{unit_id}-motion-4dir-sheet.webp"
    sheet.save(OUTPUT_DIR / filename, "WEBP", quality=88, method=4, exact=True)
    source_columns = [0, 3, 2, 1] if unit_id in SWAPPED_SIDE_UNITS else [0, 1, 2, 3]
    return {"file": f"assets/animations/directional/{filename}", "columns": SHEET_COLUMNS, "rows": len(DIRECTIONS) * len(ACTIONS), "frame": FRAME, "rowsOrder": row_order, "animations": ACTION_ANIMATIONS, "sourceColumns": source_columns, "sourceType": "authored-four-direction", "source": f"assets/animations/directional/sources/{source_path.name}"}


def vertical_variant(image: Image.Image, direction: str) -> Image.Image:
    """Create a centered vertical-view variant from approved existing art.

    Non-starter units do not have hand-painted back/front references yet. The
    narrower centered silhouette keeps down/up movement visually distinct from
    the broad side views while preserving the original unit identity.
    """
    box = image.getchannel("A").getbbox()
    subject = image.crop(box) if box else image
    width_scale = .84 if direction == "down" else .78
    subject = subject.resize((max(1, round(subject.width * width_scale)), subject.height), Image.Resampling.LANCZOS)
    if direction == "up":
        subject = ImageOps.mirror(subject)
    canvas = Image.new("RGBA", (FRAME, FRAME))
    x = (FRAME - subject.width) // 2
    y = min(FRAME - SAFE_MARGIN - subject.height, max(SAFE_MARGIN, (FRAME - subject.height) // 2))
    canvas.alpha_composite(subject, (x, y))
    return canvas


def build_legacy(unit_id: str, source_path: Path) -> dict[str, object]:
    """Upgrade an approved 4x6 left/right sheet into the 6x12 contract."""
    source = Image.open(source_path).convert("RGBA")
    sheet = Image.new("RGBA", (FRAME * SHEET_COLUMNS, FRAME * len(DIRECTIONS) * len(ACTIONS)))
    row_order: list[str] = []
    source_frames = (0, 1, 2, 3, 2, 1)
    for direction_index, direction in enumerate(DIRECTIONS):
        side_row_offset = 3 if direction == "left" else 0
        for action_index, action in enumerate(ACTIONS):
            source_action_index = {"idle": 0, "move": 1, "attack": 2, "hit": 0, "victory": 0, "death": 0}[action]
            source_row = side_row_offset + source_action_index
            row = direction_index * len(ACTIONS) + action_index
            row_order.append(f"{action}-{direction}")
            frame_count = ACTION_ANIMATIONS[action]["frameCount"]
            for frame_index in range(frame_count):
                source_index = 0 if frame_count <= 1 else round(frame_index * (len(source_frames) - 1) / (frame_count - 1))
                source_column = source_frames[source_index]
                cell = source.crop((source_column * FRAME, source_row * FRAME, (source_column + 1) * FRAME, (source_row + 1) * FRAME))
                base = contain(cell, .88)
                if direction in ("down", "up"):
                    base = vertical_variant(base, direction)
                frame = animate(base, action, direction, frame_index, frame_count)
                sheet.alpha_composite(frame, (frame_index * FRAME, row * FRAME))
                save_frame(frame, FRAME_DIR / f"{unit_id}-{action}-{direction}-frame_{frame_index + 1:02d}.png")
    filename = f"{unit_id}-motion-4dir-sheet.webp"
    sheet.save(OUTPUT_DIR / filename, "WEBP", quality=86, method=4, exact=True)
    return {
        "file": f"assets/animations/directional/{filename}", "columns": SHEET_COLUMNS,
        "rows": len(DIRECTIONS) * len(ACTIONS), "frame": FRAME, "rowsOrder": row_order, "animations": ACTION_ANIMATIONS,
        "sourceColumns": ["derived-down", "legacy-right", "derived-up", "legacy-left"],
        "sourceType": "derived-from-approved-motion",
        "source": f"assets/animations/units/{source_path.name}",
    }


def build_evolution_stage(unit_id: str, stage: int, source_path: Path) -> dict[str, object]:
    """Build a full four-direction sheet from that stage's approved portrait."""
    portrait = contain(Image.open(source_path), .86)
    right_base = portrait if unit_id in SOURCE_ALREADY_RIGHT else ImageOps.mirror(portrait)
    front_path = VIEW_DIR / f"{unit_id}-front.png"
    back_path = VIEW_DIR / f"{unit_id}-back.png"
    has_authored_vertical = stage == 1 and unit_id in SIZE2_IDS and front_path.exists() and back_path.exists()
    front_base = contain(Image.open(front_path), .9) if has_authored_vertical else None
    back_base = contain(Image.open(back_path), .9) if has_authored_vertical else None
    sheet = Image.new("RGBA", (FRAME * SHEET_COLUMNS, FRAME * len(DIRECTIONS) * len(ACTIONS)))
    row_order: list[str] = []
    for direction_index, direction in enumerate(DIRECTIONS):
        if direction == "right":
            direction_base = right_base
        elif direction == "left":
            direction_base = ImageOps.mirror(right_base)
        elif direction == "down" and front_base is not None:
            direction_base = front_base
        elif direction == "up" and back_base is not None:
            direction_base = back_base
        else:
            direction_base = vertical_variant(right_base, direction)
        for action_index, action in enumerate(ACTIONS):
            row = direction_index * len(ACTIONS) + action_index
            row_order.append(f"{action}-{direction}")
            frame_count = ACTION_ANIMATIONS[action]["frameCount"]
            for frame_index in range(frame_count):
                frame = animate(direction_base, action, direction, frame_index, frame_count)
                sheet.alpha_composite(frame, (frame_index * FRAME, row * FRAME))
                save_frame(frame, FRAME_DIR / f"{unit_id}-stage_{stage}-{action}-{direction}-frame_{frame_index + 1:02d}.png")
    filename = f"{unit_id}-stage_{stage}-motion-4dir-sheet.webp"
    sheet.save(OUTPUT_DIR / filename, "WEBP", quality=86, method=4, exact=True)
    return {
        "file": f"assets/animations/directional/{filename}", "columns": SHEET_COLUMNS,
        "rows": len(DIRECTIONS) * len(ACTIONS), "frame": FRAME, "rowsOrder": row_order, "animations": ACTION_ANIMATIONS,
        "sourceType": "authored-front-back-and-approved-side" if has_authored_vertical else "approved-evolution-portrait",
        "source": f"assets/pets/{unit_id}/evolution/{source_path.name}",
        "verticalViews": ({"down": front_path.relative_to(ROOT).as_posix(), "up": back_path.relative_to(ROOT).as_posix()}
                          if has_authored_vertical else None),
    }


def stage_one_portrait(unit_id: str) -> Path | None:
    pet_portrait = EVOLUTION_ROOT / unit_id / "evolution" / "stage_1.png"
    if pet_portrait.exists():
        return pet_portrait
    pack_portrait = ROOT / "assets" / "pack" / f"{unit_id}.png"
    return pack_portrait if pack_portrait.exists() else None


def build_size2_stage_one(unit_id: str, source_path: Path) -> dict[str, object]:
    entry = build_evolution_stage(unit_id, 1, source_path)
    generated_sheet = OUTPUT_DIR / f"{unit_id}-stage_1-motion-4dir-sheet.webp"
    final_sheet = OUTPUT_DIR / f"{unit_id}-motion-4dir-sheet.webp"
    generated_sheet.replace(final_sheet)
    for action in ACTIONS:
        for direction in DIRECTIONS:
            for frame_index in range(1, ACTION_ANIMATIONS[action]["frameCount"] + 1):
                if EXPORT_SOURCE_FRAMES:
                    generated_frame = FRAME_DIR / f"{unit_id}-stage_1-{action}-{direction}-frame_{frame_index:02d}.png"
                    final_frame = FRAME_DIR / f"{unit_id}-{action}-{direction}-frame_{frame_index:02d}.png"
                    generated_frame.replace(final_frame)
    entry["file"] = f"assets/animations/directional/{final_sheet.name}"
    entry["sourceType"] = "authored-front-back-and-approved-side"
    entry["source"] = source_path.relative_to(ROOT).as_posix()
    return entry


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    FRAME_DIR.mkdir(parents=True, exist_ok=True)
    for stale in FRAME_DIR.glob("*.png"):
        stale.unlink()
    for stale in OUTPUT_DIR.glob("*-motion-4dir-sheet.webp"):
        stale.unlink()
    authored_sources = {
        source.name.split("-four-direction-reference-")[0]: source
        for source in SOURCE_DIR.glob("*-four-direction-reference-v*-alpha.png")
    }
    manifest: dict[str, object] = {}
    legacy_manifest = json.loads((LEGACY_DIR / "manifest.json").read_text(encoding="utf-8"))
    for unit_id in sorted(legacy_manifest):
        portrait_path = stage_one_portrait(unit_id)
        # A newly approved full four-direction sheet supersedes the older
        # size-2 front/back composition.  Keep that fallback only for units
        # which do not yet have a native four-direction source.
        if unit_id in authored_sources:
            manifest[unit_id] = build_reference(unit_id, authored_sources[unit_id])
        elif unit_id in SIZE2_IDS and portrait_path:
            manifest[unit_id] = build_size2_stage_one(unit_id, portrait_path)
        else:
            manifest[unit_id] = build_legacy(unit_id, LEGACY_DIR / f"{unit_id}-motion-sheet.webp")
        manifest[unit_id]["evolutionSheets"] = {"1": manifest[unit_id]["file"]}
        evolution_dir = EVOLUTION_ROOT / unit_id / "evolution"
        for stage in (2, 3):
            stage_path = evolution_dir / f"stage_{stage}.png"
            if stage_path.exists():
                stage_entry = build_evolution_stage(unit_id, stage, stage_path)
                manifest[unit_id]["evolutionSheets"][str(stage)] = stage_entry["file"]
    manifest_json = json.dumps(manifest, ensure_ascii=False, indent=2)
    (OUTPUT_DIR / "manifest.json").write_text(manifest_json, encoding="utf-8")
    (OUTPUT_DIR / "manifest.js").write_text(
        "window.TACTICAL_MOTION_MANIFEST = " + manifest_json + ";\n", encoding="utf-8"
    )
    sheet_count = len(list(OUTPUT_DIR.glob("*-motion-4dir-sheet.webp")))
    frame_count = len(list(FRAME_DIR.glob("*.png")))
    print(f"Built {sheet_count} four-direction unit/evolution sheets and {frame_count} source PNG frames (export={'on' if EXPORT_SOURCE_FRAMES else 'off'}).")


if __name__ == "__main__":
    main()
