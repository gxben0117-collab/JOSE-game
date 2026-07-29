"""Reorder columns of an already-correct 4x3 direction/action reference."""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument(
        "--columns",
        required=True,
        help="Source column indices for output down,right,up,left.",
    )
    args = parser.parse_args()
    columns = [int(value) for value in args.columns.split(",")]
    if sorted(columns) != [0, 1, 2, 3]:
        raise ValueError("--columns must contain each of 0,1,2,3 once")

    source = Image.open(args.source).convert("RGBA")
    output = Image.new("RGBA", source.size)
    for output_column, source_column in enumerate(columns):
        x0 = round(source.width * source_column / 4)
        x1 = round(source.width * (source_column + 1) / 4)
        target_x = round(source.width * output_column / 4)
        output.alpha_composite(source.crop((x0, 0, x1, source.height)), (target_x, 0))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    output.save(args.output, "PNG", compress_level=6)
    print(f"Wrote {args.output} with columns {columns}")


if __name__ == "__main__":
    main()
