# -*- coding: utf-8 -*-
"""生成 20 隻光／暗屬性新幻獸的三階立繪（由現有幻獸重上色）與 6 隻新章節首領。

光系：金白聖光調；暗系：紫黑虛空調。每隻依索引微調色相增加辨識度。
輸出：assets/pets/<id>/evolution/stage_{1..3}.png、assets/sprites/pets/<id>-sheet.png、
     assets/enemies/<boss_id>.png
"""
import os
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# id: (來源幻獸, 屬性)
NEW_PETS = {
    'lumen_fox':      ('fire_fox', 'light'),
    'radiant_lion':   ('fire_lion', 'light'),
    'holy_rabbit':    ('leaf_ear_rabbit', 'light'),
    'dawn_deer':      ('forest_deer', 'light'),
    'lumina_whale':   ('bubble_whale', 'light'),
    'halo_jelly':     ('crystal_jellyfish', 'light'),
    'prism_dragon':   ('emerald_dragon', 'light'),
    'seraph_treant':  ('nature_guardian', 'light'),
    'gold_qilin':     ('jade_qilin', 'light'),
    'solar_phoenix':  ('sun_phoenix', 'light'),
    'night_bat':      ('inferno_bat', 'dark'),
    'abyss_serpent':  ('vine_snake', 'dark'),
    'hell_hound':     ('magma_hound', 'dark'),
    'shadow_fang':    ('crimson_wolf', 'dark'),
    'umbra_bear':     ('grass_bear', 'dark'),
    'void_crab':      ('deep_sea_crab', 'dark'),
    'dusk_shark':     ('ice_shark', 'dark'),
    'nether_eel':     ('electric_eel', 'dark'),
    'eclipse_dragon': ('blazing_dragon', 'dark'),
    'void_leviathan': ('frost_leviathan', 'dark'),
}

# 新章節首領: (來源 stage_3, 陰影, 中間, 高光, 氣場)
NEW_BOSSES = {
    'mist_sovereign':   ('emerald_god_dragon', (14, 20, 18), (96, 128, 110), (220, 245, 230), (140, 220, 190)),
    'ancient_golem':    ('volcanic_titan',     (18, 14, 12), (120, 100, 84), (235, 220, 190), (200, 170, 120)),
    'thunder_tyrant':   ('tsunami_dragon',     (12, 12, 24), (110, 100, 40), (255, 240, 140), (255, 230, 90)),
    'deep_ancient_god': ('sea_god_beast',      (4, 10, 26),  (36, 74, 140),  (140, 205, 250), (80, 160, 255)),
    'radiant_seraph':   ('sun_phoenix',        (60, 40, 14), (222, 178, 92), (255, 250, 230), (255, 226, 140)),
    'void_wolf_king':   ('crimson_wolf',       (6, 3, 14),   (76, 44, 128),  (206, 180, 250), (160, 100, 255)),
}


def palette_for(element, index):
    if element == 'light':
        drift = (index * 5) % 14
        return (58 + drift // 2, 42, 18), (230, 184 + drift, 88), (255, 250, 236), (255, 224, 130)
    drift = (index * 7) % 20
    return (8, 4, 16), (86 + drift // 2, 50, 138 + drift), (214, 188, 255), (156, 96, 255)


def recolor(source_path, shadow, mid, highlight, aura, aura_alpha=80, pad_ratio=0.07):
    art = Image.open(source_path).convert('RGBA')
    alpha = art.getchannel('A')
    gray = ImageOps.autocontrast(art.convert('L'), cutoff=1)
    toned = ImageOps.colorize(gray, black=shadow, mid=mid, white=highlight).convert('RGBA')
    toned = ImageEnhance.Contrast(toned).enhance(1.1)
    toned.putalpha(alpha)
    pad = int(max(art.size) * pad_ratio)
    canvas = Image.new('RGBA', (art.width + pad * 2, art.height + pad * 2), (0, 0, 0, 0))
    glow_alpha = alpha.resize((art.width + pad, art.height + pad))
    glow = Image.new('RGBA', glow_alpha.size, aura + (aura_alpha,))
    glow.putalpha(glow_alpha.point(lambda value: min(255, int(value * 0.8))))
    glow = glow.filter(ImageFilter.GaussianBlur(max(2, pad * 0.5)))
    canvas.alpha_composite(glow, (pad // 2, pad // 2))
    canvas.alpha_composite(toned, (pad, pad))
    return canvas


def main():
    for index, (pet_id, (source, element)) in enumerate(NEW_PETS.items()):
        shadow, mid, highlight, aura = palette_for(element, index)
        out_dir = os.path.join(ROOT, 'assets', 'pets', pet_id, 'evolution')
        os.makedirs(out_dir, exist_ok=True)
        for stage in (1, 2, 3):
            src = os.path.join(ROOT, 'assets', 'pets', source, 'evolution', 'stage_%d.png' % stage)
            image = recolor(src, shadow, mid, highlight, aura, aura_alpha=70 if element == 'light' else 88)
            image.thumbnail((460, 640) if stage < 3 else (640, 900), Image.LANCZOS)
            image.save(os.path.join(out_dir, 'stage_%d.png' % stage), optimize=True)
        sheet_dir = os.path.join(ROOT, 'assets', 'sprites', 'pets')
        os.makedirs(sheet_dir, exist_ok=True)
        Image.open(os.path.join(out_dir, 'stage_3.png')).save(os.path.join(sheet_dir, pet_id + '-sheet.png'), optimize=True)
        print('pet', pet_id, '<-', source, element)

    out = os.path.join(ROOT, 'assets', 'enemies')
    os.makedirs(out, exist_ok=True)
    for boss_id, (source, shadow, mid, highlight, aura) in NEW_BOSSES.items():
        src = os.path.join(ROOT, 'assets', 'pets', source, 'evolution', 'stage_3.png')
        image = recolor(src, shadow, mid, highlight, aura, aura_alpha=150, pad_ratio=0.16)
        draw_canvas = image
        ring = Image.new('RGBA', draw_canvas.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(ring)
        cx, cy = draw_canvas.width // 2, int(draw_canvas.height * 0.62)
        radius = int(max(draw_canvas.size) * 0.46)
        draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=aura + (110,), width=max(4, int(draw_canvas.width * 0.02)))
        draw_canvas.alpha_composite(ring.filter(ImageFilter.GaussianBlur(draw_canvas.width * 0.05)))
        image.thumbnail((760, 1040), Image.LANCZOS)
        image.save(os.path.join(out, boss_id + '.png'), optimize=True)
        print('boss', boss_id, '<-', source)


if __name__ == '__main__':
    main()
