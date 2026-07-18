# -*- coding: utf-8 -*-
"""Build transparent four-direction motion frames from approved AI reference grids.

Reference grid: 4 columns (down/right/up/left) × 3 rows (idle/move/attack).
Runtime sheet: 4 animation frames × 12 semantic rows, each frame 112×112.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "assets" / "animations" / "directional" / "sources"
OUTPUT_DIR = ROOT / "assets" / "animations" / "directional"
FRAME_DIR = OUTPUT_DIR / "frames"
FRAME = 112
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
        phases = ((0, 1, 1.0), (0, 0, 1.012), (0, -2, 1.025), (0, 0, 1.012))
    elif action == "move":
        phases = ((0, 1, 1.0), (-2, -3, .985), (0, 0, 1.0), (2, -3, 1.015))
    else:
        phases = ((-2, 1, .98), (-5, 0, .95), (8, -1, 1.08), (2, 0, 1.02))
    phase_x, phase_y, scale = phases[frame]
    if action == "attack":
        dx, dy = direction_vector[0] * phase_x, direction_vector[1] * phase_x + phase_y
    elif direction in ("left", "right"):
        dx, dy = phase_x, phase_y
    else:
        dx, dy = phase_x // 2, phase_y
    work = base
    if scale != 1:
        work = base.resize((int(FRAME * scale), int(FRAME * scale)), Image.Resampling.LANCZOS)
    result = Image.new("RGBA", (FRAME, FRAME))
    result.alpha_composite(work, ((FRAME - work.width) // 2 + dx, FRAME - work.height + dy))
    return result


def build_reference(unit_id: str, source_path: Path) -> dict[str, object]:
    source = Image.open(source_path).convert("RGBA")
    FRAME_DIR.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGBA", (FRAME * 4, FRAME * 12))
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
            for frame_index in range(4):
                frame = animate(base, action, direction, frame_index)
                sheet.alpha_composite(frame, (frame_index * FRAME, row * FRAME))
                frame.save(FRAME_DIR / f"{unit_id}-{action}-{direction}-frame_{frame_index + 1:02d}.png", optimize=True)
    filename = f"{unit_id}-motion-4dir-sheet.webp"
    sheet.save(OUTPUT_DIR / filename, "WEBP", quality=88, method=6, exact=True)
    source_columns = [0, 3, 2, 1] if unit_id in SWAPPED_SIDE_UNITS else [0, 1, 2, 3]
    return {"file": f"assets/animations/directional/{filename}", "columns": 4, "rows": 12, "frame": FRAME, "rowsOrder": row_order, "sourceColumns": source_columns, "source": f"assets/animations/directional/sources/{source_path.name}"}


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, object] = {}
    for source in sorted(SOURCE_DIR.glob("*-four-direction-reference-v*-alpha.png")):
        unit_id = source.name.split("-four-direction-reference-")[0]
        manifest[unit_id] = build_reference(unit_id, source)
    (OUTPUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Built {len(manifest)} four-direction unit sheets and {len(manifest) * 48} transparent frames.")


if __name__ == "__main__":
    main()
