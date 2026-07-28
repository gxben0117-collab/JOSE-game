# -*- coding: utf-8 -*-
"""Validate every WebP cell in the runtime four-direction sprite sheets.

The old tool only searched a retired PNG export directory, so it could report a
misleading successful check of zero frames. Runtime battles render the WebP
sheet declared by the directional manifest; validate those exact 8×24 cells.
"""
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "assets" / "animations" / "directional" / "manifest.json"
SAFE_MARGIN = 1


manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
unsafe: list[str] = []
checked = 0
for unit_id, entry in sorted(manifest.items()):
    path = ROOT / entry["file"]
    columns, rows, frame = entry["columns"], entry["rows"], entry["frame"]
    with Image.open(path) as image:
        if image.width != columns * frame or image.height != rows * frame:
            unsafe.append(f"{unit_id}: sheet size {image.size} does not match {columns}×{rows} cells at {frame}px")
            continue
        alpha = image.convert("RGBA").getchannel("A")
        for row in range(rows):
            for column in range(columns):
                left, top = column * frame, row * frame
                box = alpha.crop((left, top, left + frame, top + frame)).getbbox()
                checked += 1
                if not box:
                    unsafe.append(f"{unit_id}: {entry['rowsOrder'][row]} frame {column + 1} is transparent")
                elif box[0] < SAFE_MARGIN or box[1] < SAFE_MARGIN or box[2] > frame - SAFE_MARGIN or box[3] > frame - SAFE_MARGIN:
                    unsafe.append(f"{unit_id}: {entry['rowsOrder'][row]} frame {column + 1} touches edge {box}")

if unsafe:
    raise SystemExit("Directional frames exceed their safe bounds:\n" + "\n".join(unsafe))

print(f"Directional frame bounds PASS: {checked} runtime WebP frames across {len(manifest)} units")
