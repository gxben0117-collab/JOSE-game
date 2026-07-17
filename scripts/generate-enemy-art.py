# -*- coding: utf-8 -*-
"""從現有幻獸立繪生成敵方魔物圖：12 種小兵（單階）與 4 隻 Boss。

處理方式：保留原始剪影與透明背景，將亮度重新映射到魔物專屬的
暗色調色盤，再疊加同色系的暗黑氣場，使敵人與我方幻獸風格一致
但一眼可辨。輸出到 assets/enemies/。
"""
import os
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'enemies')

# id: (來源幻獸, 階段, 陰影色, 中間色, 高光色, 氣場色)
MINIONS = {
    'ember_imp':      ('molten_ball',   1, (26, 8, 10),   (168, 44, 30),  (255, 176, 92),  (255, 92, 40)),
    'ash_hound':      ('magma_hound',   1, (20, 10, 12),  (140, 52, 40),  (255, 140, 84),  (255, 110, 60)),
    'cinder_bat':     ('inferno_bat',   1, (24, 6, 16),   (150, 40, 56),  (255, 150, 110), (255, 80, 70)),
    'flame_wisp':     ('flame_spirit',  1, (30, 12, 6),   (190, 70, 24),  (255, 205, 120), (255, 150, 60)),
    'blight_boar':    ('thorn_boar',    1, (10, 18, 8),   (70, 110, 44),  (180, 230, 120), (120, 200, 80)),
    'thorn_creeper':  ('vine_snake',    1, (8, 20, 12),   (52, 118, 60),  (160, 235, 140), (100, 220, 110)),
    'venom_mantis':   ('poison_mantis', 1, (14, 20, 6),   (96, 130, 30),  (210, 240, 110), (170, 230, 70)),
    'gloom_turtle':   ('moss_turtle',   1, (10, 16, 14),  (60, 100, 76),  (150, 220, 170), (90, 200, 140)),
    'murk_fish':      ('coral_fish',    1, (6, 14, 24),   (40, 88, 140),  (140, 200, 255), (80, 170, 255)),
    'tide_spawn':     ('kraken_spawn',  1, (8, 10, 26),   (52, 70, 150),  (150, 180, 255), (100, 140, 255)),
    'frost_shell':    ('deep_sea_crab', 1, (10, 16, 26),  (58, 104, 150), (170, 225, 255), (110, 200, 255)),
    'void_eel':       ('electric_eel',  1, (14, 8, 26),   (86, 60, 160),  (200, 170, 255), (150, 110, 255)),
}

BOSSES = {
    'infernal_overlord': ('crimson_dragon',  3, (22, 4, 6),   (170, 30, 26),  (255, 196, 88),  (255, 70, 30)),
    'rotwood_colossus':  ('ancient_treant',  3, (8, 14, 6),   (66, 104, 36),  (198, 240, 120), (130, 220, 70)),
    'abyssal_tide_king': ('frost_leviathan', 3, (4, 10, 24),  (34, 78, 150),  (150, 215, 255), (70, 160, 255)),
    'rift_devourer':     ('abyss_dragon',    3, (16, 6, 26),  (104, 44, 170), (230, 170, 255), (180, 90, 255)),
}


def corrupt(source_id, stage, shadow, mid, highlight, aura, is_boss):
    path = os.path.join(ROOT, 'assets', 'pets', source_id, 'evolution', 'stage_%d.png' % stage)
    art = Image.open(path).convert('RGBA')
    alpha = art.getchannel('A')

    gray = ImageOps.autocontrast(art.convert('L'), cutoff=1)
    toned = ImageOps.colorize(gray, black=shadow, mid=mid, white=highlight).convert('RGBA')
    toned = ImageEnhance.Contrast(toned).enhance(1.22 if is_boss else 1.12)
    toned = ImageEnhance.Color(toned).enhance(1.25)
    toned.putalpha(alpha)

    # 同色系暗黑氣場：以本體剪影模糊放大後墊底。
    pad = int(max(art.size) * (0.16 if is_boss else 0.10))
    canvas = Image.new('RGBA', (art.width + pad * 2, art.height + pad * 2), (0, 0, 0, 0))
    glow_alpha = alpha.resize((art.width + pad, art.height + pad))
    glow = Image.new('RGBA', glow_alpha.size, aura + ((150 if is_boss else 96),))
    glow.putalpha(glow_alpha.point(lambda value: min(255, int(value * 0.85))))
    glow = glow.filter(ImageFilter.GaussianBlur(pad * (0.55 if is_boss else 0.45)))
    canvas.alpha_composite(glow, (pad // 2, pad // 2))

    if is_boss:  # Boss 再加一圈外緣光暈強調體型與威壓感
        ring = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(ring)
        cx, cy = canvas.width // 2, int(canvas.height * 0.62)
        radius = int(max(canvas.size) * 0.46)
        draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=aura + (110,), width=max(4, pad // 6))
        canvas.alpha_composite(ring.filter(ImageFilter.GaussianBlur(pad * 0.35)))

    canvas.alpha_composite(toned, (pad, pad))
    return canvas


def main():
    os.makedirs(OUT, exist_ok=True)
    for group, is_boss in ((MINIONS, False), (BOSSES, True)):
        for enemy_id, (source, stage, shadow, mid, highlight, aura) in group.items():
            image = corrupt(source, stage, shadow, mid, highlight, aura, is_boss)
            image.thumbnail((760, 1040) if is_boss else (420, 560), Image.LANCZOS)
            target = os.path.join(OUT, enemy_id + '.png')
            image.save(target, optimize=True)
            print('%s <- %s stage_%d %s' % (enemy_id, source, stage, image.size))


if __name__ == '__main__':
    main()
