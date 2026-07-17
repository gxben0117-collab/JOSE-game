# -*- coding: utf-8 -*-
"""10 隻章節首領的專屬神話小兵（各 2 隻，敵方限定）。
   取材各國神話：樹精、報喪女妖、火蜥精、石像鬼、霜巨人、雷鳥、賽蓮、智天使、地獄犬、奇美拉等。
   由素材包幻獸重上色為魔物風格，輸出 assets/enemies/。"""
import os
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, 'assets', 'pack')
OUT = os.path.join(ROOT, 'assets', 'enemies')

# id: (素材包來源, 陰影, 中間, 高光, 氣場)
MINIONS = {
    # c1 腐木巨像：樹精與恩特（歐洲森林神話）
    'dryad_thorn':     ('spore_hedgehog',   (8, 16, 8),   (66, 108, 52),  (176, 226, 140), (110, 200, 90)),
    'ent_sapling':     ('bamboo_panda',     (10, 18, 10), (58, 96, 48),   (160, 210, 130), (96, 180, 80)),
    # c2 迷霧妖龍：報喪女妖與鬼火（凱爾特）
    'mist_banshee':    ('orchid_gecko',     (14, 18, 20), (92, 122, 118), (210, 240, 230), (150, 220, 200)),
    'fog_wisp':        ('nectar_moth',      (12, 16, 18), (104, 130, 124), (222, 246, 238), (170, 230, 210)),
    # c3 炎獄魔龍王：火蜥精與焰巨人（煉金術／北歐史爾特爾）
    'salamander_fiend':('scarlet_salamander',(24, 8, 6),  (168, 54, 26),  (255, 190, 96),  (255, 120, 50)),
    'surtr_spawn':     ('blast_ram',        (26, 10, 6),  (180, 62, 24),  (255, 200, 104), (255, 140, 56)),
    # c4 古城魔像：石像鬼與魔像（西歐／猶太傳說）
    'gargoyle_watcher':('mirror_armadillo', (14, 12, 16), (104, 96, 112), (216, 208, 226), (170, 160, 190)),
    'golem_sentinel':  ('obsidian_gorilla', (12, 10, 14), (92, 84, 100),  (200, 192, 212), (150, 140, 170)),
    # c5 冰淵潮王：霜巨人與海豹妖（北歐約頓／蘇格蘭賽爾奇）
    'jotunn_frost':    ('glacier_penguin',  (8, 14, 26),  (66, 110, 158), (182, 228, 255), (120, 200, 255)),
    'selkie_hunter':   ('kelp_otter',       (8, 12, 24),  (56, 98, 146),  (170, 218, 252), (108, 188, 250)),
    # c6 雷鳴暴龍：雷鳥與雷獸（北美原住民／日本）
    'thunderbird_kin': ('comet_heron',      (14, 14, 8),  (140, 128, 44), (255, 244, 150), (255, 232, 96)),
    'raiju_beast':     ('bramble_lynx',     (16, 14, 8),  (150, 134, 48), (255, 248, 160), (255, 238, 110)),
    # c7 沉海古神：賽蓮與克拉肯（希臘／北歐）
    'siren_lure':      ('lantern_koi',      (6, 12, 26),  (48, 92, 150),  (156, 210, 255), (96, 176, 255)),
    'kraken_tentacle': ('void_anglerfish',  (6, 10, 24),  (42, 80, 138),  (146, 200, 250), (86, 166, 250)),
    # c8 熾光神翼：智天使與不死鳥侍祭（希伯來／埃及貝努鳥）
    'cherub_guard':    ('star_ram',         (58, 44, 16), (222, 182, 96), (255, 250, 232), (255, 228, 140)),
    'bennu_acolyte':   ('flare_hummingbird',(60, 46, 18), (230, 188, 100),(255, 252, 236), (255, 234, 150)),
    # c9 暗獄狼王：地獄犬與夢魔（希臘克爾柏洛斯／北歐瑪拉）
    'cerberus_whelp':  ('hollow_hyena',     (8, 4, 16),   (84, 48, 132),  (206, 178, 248), (156, 96, 250)),
    'mara_fiend':      ('nightmare_tapir',  (10, 5, 18),  (92, 54, 142),  (214, 186, 252), (166, 106, 252)),
    # c10 裂隙吞噬者：奇美拉與利維坦裔（希臘／希伯來）
    'chimera_spawn':   ('comet_tiger',      (16, 8, 20),  (120, 66, 150), (232, 196, 255), (186, 120, 255)),
    'leviathan_brood': ('reef_hammerhead',  (12, 8, 22),  (98, 60, 146),  (218, 188, 252), (170, 110, 252)),
}


def corrupt(source_path, shadow, mid, highlight, aura):
    art = Image.open(source_path).convert('RGBA')
    alpha = art.getchannel('A')
    gray = ImageOps.autocontrast(art.convert('L'), cutoff=1)
    toned = ImageOps.colorize(gray, black=shadow, mid=mid, white=highlight).convert('RGBA')
    toned = ImageEnhance.Contrast(toned).enhance(1.14)
    toned = ImageEnhance.Color(toned).enhance(1.2)
    toned.putalpha(alpha)
    pad = int(max(art.size) * 0.1)
    canvas = Image.new('RGBA', (art.width + pad * 2, art.height + pad * 2), (0, 0, 0, 0))
    glow_alpha = alpha.resize((art.width + pad, art.height + pad))
    glow = Image.new('RGBA', glow_alpha.size, aura + (96,))
    glow.putalpha(glow_alpha.point(lambda value: min(255, int(value * 0.85))))
    glow = glow.filter(ImageFilter.GaussianBlur(max(2, int(pad * 0.45))))
    canvas.alpha_composite(glow, (pad // 2, pad // 2))
    canvas.alpha_composite(toned, (pad, pad))
    return canvas


def main():
    for minion_id, (source, shadow, mid, highlight, aura) in MINIONS.items():
        image = corrupt(os.path.join(PACK, source + '.png'), shadow, mid, highlight, aura)
        image.thumbnail((420, 560), Image.LANCZOS)
        image.save(os.path.join(OUT, minion_id + '.png'), optimize=True)
        print(minion_id, '<-', source)


if __name__ == '__main__':
    main()
