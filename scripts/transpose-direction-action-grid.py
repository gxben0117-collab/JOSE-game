"""Transpose an AI 4-row direction grid into the runtime 4x3 reference grid.

Input layout:
  rows    = down, right, up, left
  columns = idle, move, attack, unused

Output layout:
  columns = down, right, up, left
  rows    = idle, move, attack
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--direction-rows",
        default="0,1,2,3",
        help="Source row indices to use for output down,right,up,left.",
    )
    args = parser.parse_args()
    direction_rows = [int(value) for value in args.direction_rows.split(",")]
    if sorted(direction_rows) != [0, 1, 2, 3]:
        raise ValueError("--direction-rows must contain each of 0,1,2,3 once")

    source = Image.open(args.source).convert("RGB")
    key = source.getpixel((0, 0))
    cell = source.width // 4
    output = Image.new("RGB", (cell * 4, cell * 3), key)

    for direction, source_row in enumerate(direction_rows):
        y0 = round(source.height * source_row / 4)
        y1 = round(source.height * (source_row + 1) / 4)
        for action in range(3):
            x0 = round(source.width * action / 4)
            x1 = round(source.width * (action + 1) / 4)
            frame = source.crop((x0, y0, x1, y1))
            frame.thumbnail((cell - 12, cell - 12), Image.Resampling.LANCZOS)
            x = direction * cell + (cell - frame.width) // 2
            y = action * cell + (cell - frame.height) // 2
            output.paste(frame, (x, y))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    output.save(args.output, "PNG", compress_level=6)
    print(f"Wrote {args.output} ({output.width}x{output.height})")


if __name__ == "__main__":
    main()
