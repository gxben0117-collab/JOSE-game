# -*- coding: utf-8 -*-
"""Build transparent four-direction motion frames from approved AI reference grids.

Reference grid: 4 columns (down/right/up/left) × 3 rows (idle/move/attack).
Runtime sheet: 6 animation frames × 12 semantic rows, each frame 112×112.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "assets" / "animations" / "directional" / "sources"
OUTPUT_DIR = ROOT / "assets" / "animations" / "directional"
FRAME_DIR = OUTPUT_DIR / "frames"
LEGACY_DIR = ROOT / "assets" / "animations" / "units"
FRAME = 112
ANIMATION_FRAMES = 6
SAFE_MARGIN = 3
DIRECTIONS = ("down", "right", "up", "left")
ACTIONS = ("idle", "move", "attack")
# 這三張 AI 參考圖的側面欄位是依「角色看向畫面中央」構圖，
# 實際內容與提示標籤相反，因此合圖時交換第 2、4 欄。
SWAPPED_SIDE_UNITS = {"fire_lion", "fire_fox", "leaf_ear_rabbit"}


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


def animate(base: Image.Image, action: str, direction: str, frame: int) -> Image.Image:
    direction_vector = {"down": (0, 1), "right": (1, 0), "up": (0, -1), "left": (-1, 0)}[direction]
    if action == "idle":
        phases = ((0, 1, 1.0), (0, 0, 1.008), (0, -1, 1.016), (0, -2, 1.025), (0, -1, 1.016), (0, 0, 1.008))
    elif action == "move":
        phases = ((-1, 1, 1.0), (1, -2, .99), (2, -4, .98), (0, 0, 1.0), (-2, -3, 1.01), (-1, 0, 1.005))
    else:
        phases = ((-2, 1, .98), (-5, 1, .95), (-7, 0, .94), (8, -1, 1.08), (4, 0, 1.04), (0, 1, 1.0))
    phase_x, phase_y, scale = phases[frame]
    if action == "attack":
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
    frame.save(path, "PNG", compress_level=6)


def build_reference(unit_id: str, source_path: Path) -> dict[str, object]:
    source = Image.open(source_path).convert("RGBA")
    FRAME_DIR.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGBA", (FRAME * ANIMATION_FRAMES, FRAME * 12))
    row_order: list[str] = []
    for direction_index, direction in enumerate(DIRECTIONS):
        source_column = ({"right": 3, "left": 1}.get(direction, direction_index)
                         if unit_id in SWAPPED_SIDE_UNITS else direction_index)
        for action_index, action in enumerate(ACTIONS):
            x0 = round(source.width * source_column / 4) + 4
            x1 = round(source.width * (source_column + 1) / 4) - 4
            y0 = round(source.height * action_index / 3) + 4
            y1 = round(source.height * (action_index + 1) / 3) - 4
            base = contain(source.crop((x0, y0, x1, y1)))
            row = direction_index * 3 + action_index
            row_order.append(f"{action}-{direction}")
            for frame_index in range(ANIMATION_FRAMES):
                frame = animate(base, action, direction, frame_index)
                sheet.alpha_composite(frame, (frame_index * FRAME, row * FRAME))
                save_frame(frame, FRAME_DIR / f"{unit_id}-{action}-{direction}-frame_{frame_index + 1:02d}.png")
    filename = f"{unit_id}-motion-4dir-sheet.webp"
    sheet.save(OUTPUT_DIR / filename, "WEBP", quality=88, method=4, exact=True)
    source_columns = [0, 3, 2, 1] if unit_id in SWAPPED_SIDE_UNITS else [0, 1, 2, 3]
    return {"file": f"assets/animations/directional/{filename}", "columns": ANIMATION_FRAMES, "rows": 12, "frame": FRAME, "rowsOrder": row_order, "sourceColumns": source_columns, "sourceType": "authored-four-direction", "source": f"assets/animations/directional/sources/{source_path.name}"}


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
    sheet = Image.new("RGBA", (FRAME * ANIMATION_FRAMES, FRAME * 12))
    row_order: list[str] = []
    source_frames = (0, 1, 2, 3, 2, 1)
    for direction_index, direction in enumerate(DIRECTIONS):
        side_row_offset = 3 if direction == "left" else 0
        for action_index, action in enumerate(ACTIONS):
            source_row = side_row_offset + action_index
            row = direction_index * 3 + action_index
            row_order.append(f"{action}-{direction}")
            for frame_index, source_column in enumerate(source_frames):
                cell = source.crop((source_column * FRAME, source_row * FRAME, (source_column + 1) * FRAME, (source_row + 1) * FRAME))
                base = contain(cell, .88)
                if direction in ("down", "up"):
                    base = vertical_variant(base, direction)
                frame = animate(base, action, direction, frame_index)
                sheet.alpha_composite(frame, (frame_index * FRAME, row * FRAME))
                save_frame(frame, FRAME_DIR / f"{unit_id}-{action}-{direction}-frame_{frame_index + 1:02d}.png")
    filename = f"{unit_id}-motion-4dir-sheet.webp"
    sheet.save(OUTPUT_DIR / filename, "WEBP", quality=86, method=4, exact=True)
    return {
        "file": f"assets/animations/directional/{filename}", "columns": ANIMATION_FRAMES,
        "rows": 12, "frame": FRAME, "rowsOrder": row_order,
        "sourceColumns": ["derived-down", "legacy-right", "derived-up", "legacy-left"],
        "sourceType": "derived-from-approved-motion",
        "source": f"assets/animations/units/{source_path.name}",
    }


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
        if unit_id in authored_sources:
            manifest[unit_id] = build_reference(unit_id, authored_sources[unit_id])
        else:
            manifest[unit_id] = build_legacy(unit_id, LEGACY_DIR / f"{unit_id}-motion-sheet.webp")
    (OUTPUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Built {len(manifest)} four-direction unit sheets and {len(manifest) * 12 * ANIMATION_FRAMES} transparent frames.")


if __name__ == "__main__":
    main()
