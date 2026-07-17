"""將正方形 4x4 圖集切成 16 張 PNG，供 CLAUBE/CLAUDE 匯入遊戲使用。"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("prefix")
    args = parser.parse_args()

    image = Image.open(args.input).convert("RGBA")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    cell_w = image.width // 4
    cell_h = image.height // 4

    for row in range(4):
        for col in range(4):
            index = row * 4 + col + 1
            left = col * cell_w
            top = row * cell_h
            right = image.width if col == 3 else (col + 1) * cell_w
            bottom = image.height if row == 3 else (row + 1) * cell_h
            tile = image.crop((left, top, right, bottom))
            tile.save(args.output_dir / f"{args.prefix}_{index:02d}.png")


if __name__ == "__main__":
    main()
