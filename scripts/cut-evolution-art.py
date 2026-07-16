"""Cut every transparent three-column evolution sheet into clean padded stage portraits."""
from pathlib import Path
from collections import deque
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PADDING = 12

def largest_silhouettes(source: Image.Image):
    """Return the three main alpha-connected character silhouettes, left to right."""
    width, height = source.size
    alpha = source.getchannel('A').load()
    seen = bytearray(width * height)
    components = []
    for y in range(height):
        for x in range(width):
            start = y * width + x
            if seen[start] or not alpha[x, y]:
                continue
            seen[start] = 1
            queue = deque([(x, y)])
            pixels = []
            min_x = max_x = x
            min_y = max_y = y
            while queue:
                px, py = queue.popleft()
                pixels.append(py * width + px)
                min_x, max_x = min(min_x, px), max(max_x, px)
                min_y, max_y = min(min_y, py), max(max_y, py)
                for dx, dy in ((-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)):
                    nx, ny = px + dx, py + dy
                    index = ny * width + nx
                    if 0 <= nx < width and 0 <= ny < height and not seen[index] and alpha[nx, ny]:
                        seen[index] = 1
                        queue.append((nx, ny))
            components.append((len(pixels), min_x, min_y, max_x + 1, max_y + 1, pixels))
    main = sorted(components, reverse=True)[:3]
    if len(main) != 3:
        raise ValueError('expected three evolution silhouettes')
    return sorted(main, key=lambda item: item[1])

def crop_stage(source: Image.Image, silhouette) -> Image.Image:
    _, left, top, right, bottom, pixels = silhouette
    width, _ = source.size
    # Keep only this connected silhouette. This prevents a neighbouring form
    # from leaking in where the original three evolution columns overlap.
    mask_data = bytearray(width * source.height)
    for index in pixels:
        mask_data[index] = 255
    mask = Image.frombytes('L', source.size, bytes(mask_data))
    isolated = Image.new('RGBA', source.size)
    isolated.paste(source, mask=mask)
    portrait = isolated.crop((left, top, right, bottom))
    result = Image.new('RGBA', (portrait.width + PADDING * 2, portrait.height + PADDING * 2))
    result.alpha_composite(portrait, (PADDING, PADDING))
    return result

count = 0
for sheet in sorted(ROOT.glob('assets/pets/*/evolution/evolution-sheet-v1.png')):
    with Image.open(sheet) as image:
        source = image.convert('RGBA')
        silhouettes = largest_silhouettes(source)
        for stage, silhouette in enumerate(silhouettes):
            target = sheet.parent / f'stage_{stage + 1}.png'
            crop_stage(source, silhouette).save(target, optimize=True)
            count += 1

if count != 135:
    raise SystemExit(f'Expected 135 stage images, created {count}.')
print(f'Created {count} transparent evolution portraits.')
