"""Turn every chapter's approved long-scroll master into playable 21x10 maps.

Each normal stage receives its own camera window travelling left-to-right over
the painted route. Boss and HARD maps deliberately remain separate arenas.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
MAPS = ROOT / "assets" / "maps"
TARGET = (1680, 800)
COUNTS = {**{chapter: 10 for chapter in range(1, 12)}, **{chapter: 6 for chapter in range(12, 21)}}


def make_stage(master: Image.Image, index: int, count: int) -> Image.Image:
    """Use a moving 21:10 camera so each stage reveals a later route section."""
    width, height = master.size
    # The generated master is intentionally broad but close to 21:10 itself.
    # A full-width crop would make all stage files look almost identical, so
    # each tactical window shows roughly three-fifths of the route and then
    # advances to the right on subsequent missions.
    crop_width = round(width * .62)
    crop_height = round(crop_width * TARGET[1] / TARGET[0])
    progress = 0 if count <= 1 else index / (count - 1)
    left = round((width - crop_width) * progress)
    top = max(0, min(height - crop_height, round((height - crop_height) * (0.48 + 0.12 * progress))))
    frame = master.crop((left, top, left + crop_width, top + crop_height)).resize(TARGET, Image.Resampling.LANCZOS)
    return ImageEnhance.Color(ImageEnhance.Contrast(frame).enhance(1.0 + progress * .035)).enhance(1.0 + progress * .025)


def main() -> None:
    made = 0
    for chapter, count in COUNTS.items():
        master_path = MAPS / f"chapter-{chapter:02d}-longscroll-master-v2.png"
        if not master_path.exists():
            raise FileNotFoundError(master_path)
        with Image.open(master_path) as source:
            master = source.convert("RGB")
            for stage in range(1, count + 1):
                out = MAPS / f"chapter-{chapter:02d}-story-{stage:02d}-21x10.jpg"
                make_stage(master, stage - 1, count).save(out, quality=92, optimize=True, progressive=True)
                made += 1
            # 第 17 章後的長卷原畫同時是 Boss／HARD 支線戰場的正式來源。
            # Boss 固定取最右端終點；三個 HARD 取不同路段並調整對比與色彩，
            # 保留同章世界觀，同時避免只是重複普通關卡的同一張畫面。
            if chapter >= 17:
                boss = ImageEnhance.Contrast(make_stage(master, count - 1, count)).enhance(1.12)
                boss.save(MAPS / f"chapter-{chapter:02d}-boss-21x10.jpg", quality=93, optimize=True, progressive=True)
                made += 1
                for hard in range(1, 4):
                    position = (hard / 4) * (count - 1)
                    arena = make_stage(master, position, count)
                    arena = ImageEnhance.Contrast(arena).enhance(1.06 + hard * .035)
                    arena = ImageEnhance.Color(arena).enhance(1.02 + hard * .04)
                    arena.save(MAPS / f"chapter-{chapter:02d}-hard-{hard}-21x10.jpg", quality=92, optimize=True, progressive=True)
                    made += 1
    print(f"Built {made} long-scroll stage maps from {len(COUNTS)} chapter masters.")


if __name__ == "__main__":
    main()
