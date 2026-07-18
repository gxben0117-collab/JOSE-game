# -*- coding: utf-8 -*-
"""Fail when a directional sprite touches a frame edge and may look sliced."""
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
FRAME_DIR = ROOT / "assets" / "animations" / "directional" / "frames"
SAFE_MARGIN = 3


unsafe: list[str] = []
for path in sorted(FRAME_DIR.glob("*.png")):
    with Image.open(path) as image:
        box = image.convert("RGBA").getchannel("A").getbbox()
        if box and (
            box[0] < SAFE_MARGIN
            or box[1] < SAFE_MARGIN
            or box[2] > image.width - SAFE_MARGIN
            or box[3] > image.height - SAFE_MARGIN
        ):
            unsafe.append(f"{path.name}: {box}")

if unsafe:
    raise SystemExit("Directional frames exceed their safe bounds:\n" + "\n".join(unsafe))

print(f"Directional frame bounds PASS: {len(list(FRAME_DIR.glob('*.png')))} frames")
