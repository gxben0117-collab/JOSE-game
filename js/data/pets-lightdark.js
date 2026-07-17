/* 光／暗屬性擴充：20 隻新幻獸（10 光 + 10 暗）。
   立繪由 scripts/generate-lightdark-art.py 生成；光暗互剋（雙向 1.25）。 */
(function () {
  'use strict';

  ELEMENT_CONFIG.light = { label: '光', icon: '✨', color: '#ffd76a', strong: 'dark', weak: 'dark' };
  ELEMENT_CONFIG.dark = { label: '暗', icon: '🌑', color: '#a277ff', strong: 'light', weak: 'light' };

  function pet(id, name, element, quality, icon, hp, atk, def, skills) {
    return { id: id, name: name, element: element, quality: quality, icon: icon, baseHp: hp, baseAtk: atk, baseDef: def, skills: skills };
  }
  function s(name, type, effect, multiplier, cooldown, value) {
    var skill = { name: name, type: type, effect: effect, multiplier: multiplier };
    if (cooldown) skill.cooldown = cooldown;
    if (value) skill.value = value;
    return skill;
  }

  var LIGHT_DARK_PETS = [
    // ── 光系 ──
    pet('lumen_fox', '聖光狐', 'light', 'rare', '✨', 570, 132, 52, [
      s('聖光彈', 'basic', 'damage', 1.0), s('曦光斬', 'active', 'damage', 1.5, 2), s('聖光爆', 'active', 'damage_all', 0.62, 3)]),
    pet('radiant_lion', '耀光獅', 'light', 'rare', '🦁', 660, 112, 68, [
      s('光爪', 'basic', 'damage', 1.0), s('聖盾咆哮', 'active', 'shield', 0.8, 3, 0.75), s('耀光衝擊', 'active', 'damage', 1.45, 2)]),
    pet('holy_rabbit', '晨光兔', 'light', 'rare', '🐰', 590, 108, 56, [
      s('光芒', 'basic', 'damage', 0.95), s('晨光治癒', 'active', 'heal', 0.95, 1), s('聖潔之光', 'active', 'heal_all', 0.7, 3)]),
    pet('dawn_deer', '曦光鹿', 'light', 'elite', '🦌', 940, 188, 118, [
      s('曦光角', 'basic', 'damage', 0.95), s('黎明祝福', 'active', 'heal', 1.0, 1), s('曙光降臨', 'active', 'heal_all', 0.75, 3)]),
    pet('lumina_whale', '聖輝鯨', 'light', 'elite', '🐋', 1020, 172, 128, [
      s('輝光噴流', 'basic', 'damage', 0.95), s('聖輝護罩', 'active', 'shield', 0.85, 3, 0.8), s('光潮共鳴', 'active', 'buff_atk', 0.8, 4)]),
    pet('halo_jelly', '光暈水母', 'light', 'elite', '💠', 880, 196, 112, [
      s('光刺', 'basic', 'damage', 0.95), s('光暈修復', 'active', 'heal', 1.05, 1), s('聖光洗禮', 'active', 'heal_all', 0.72, 3)]),
    pet('prism_dragon', '稜光龍', 'light', 'epic', '🐉', 2050, 452, 276, [
      s('稜光吐息', 'basic', 'damage', 1.0), s('折射光束', 'active', 'damage', 1.55, 2), s('七彩星爆', 'active', 'damage_all', 0.66, 3)]),
    pet('seraph_treant', '曙光樹靈', 'light', 'epic', '🌳', 2150, 420, 296, [
      s('聖枝', 'basic', 'damage', 0.95), s('生命聖露', 'active', 'heal', 1.0, 1), s('聖域庇護', 'active', 'shield', 0.9, 3, 0.85)]),
    pet('gold_qilin', '耀金麒麟', 'light', 'legendary', '🦄', 4600, 905, 515, [
      s('金光踏', 'basic', 'damage', 1.0), s('麒麟聖焰', 'active', 'damage_all', 0.68, 3), s('天光審判', 'active', 'damage', 1.7, 3)]),
    pet('solar_phoenix', '聖陽鳳凰', 'light', 'mythical', '🕊️', 9200, 1760, 915, [
      s('聖陽羽', 'basic', 'damage', 1.0), s('鳳凰涅槃', 'active', 'heal_all', 0.85, 3), s('聖陽天焰', 'active', 'damage_all', 0.72, 3)]),
    // ── 暗系 ──
    pet('night_bat', '夜梟魔蝠', 'dark', 'rare', '🦇', 560, 128, 50, [
      s('暗夜音波', 'basic', 'damage', 0.95), s('暗影尖嘯', 'active', 'damage', 1.4, 2), s('夜幕降臨', 'active', 'damage_all', 0.6, 3)]),
    pet('abyss_serpent', '冥影魔蛇', 'dark', 'rare', '🐍', 585, 122, 58, [
      s('冥牙', 'basic', 'damage', 0.95), s('暗影纏繞', 'active', 'damage', 1.42, 2), s('冥毒瀰漫', 'active', 'damage_all', 0.62, 3)]),
    pet('hell_hound', '冥獄犬', 'dark', 'rare', '🐺', 610, 130, 54, [
      s('冥火撕咬', 'basic', 'damage', 1.0), s('地獄突襲', 'active', 'damage', 1.5, 2), s('冥焰旋風', 'active', 'damage_all', 0.6, 3)]),
    pet('shadow_fang', '暗影魔狼', 'dark', 'elite', '🌘', 890, 208, 116, [
      s('影爪', 'basic', 'damage', 1.0), s('暗影撕裂', 'active', 'damage', 1.55, 2), s('狼嚎黑潮', 'active', 'damage_all', 0.64, 3)]),
    pet('umbra_bear', '暗爪魔熊', 'dark', 'elite', '🐻', 1050, 178, 138, [
      s('暗爪拍擊', 'basic', 'damage', 0.95), s('暗殼硬化', 'active', 'shield', 0.85, 3, 0.8), s('暗影重擊', 'active', 'damage', 1.5, 2)]),
    pet('void_crab', '暗晶魔蟹', 'dark', 'elite', '🦀', 1080, 168, 142, [
      s('暗晶鉗', 'basic', 'damage', 0.95), s('虛空甲殼', 'active', 'shield', 0.88, 3, 0.82), s('暗晶碎擊', 'active', 'damage', 1.48, 2)]),
    pet('dusk_shark', '暗淵鯊', 'dark', 'epic', '🦈', 1980, 470, 268, [
      s('暗渦撕咬', 'basic', 'damage', 1.05), s('深淵狂噬', 'active', 'damage', 1.6, 2), s('暗流絞殺', 'active', 'damage_all', 0.66, 3)]),
    pet('nether_eel', '冥雷鰻', 'dark', 'epic', '⚡', 1900, 462, 262, [
      s('冥雷擊', 'basic', 'damage', 1.0), s('暗雷鎖鏈', 'active', 'damage', 1.5, 2), s('冥界雷暴', 'active', 'damage_all', 0.68, 3)]),
    pet('eclipse_dragon', '蝕月黑龍', 'dark', 'legendary', '🌒', 4550, 918, 505, [
      s('蝕月吐息', 'basic', 'damage', 1.0), s('黑日蝕擊', 'active', 'damage', 1.68, 3), s('月蝕滅世', 'active', 'damage_all', 0.7, 3)]),
    pet('void_leviathan', '冥淵霸獸', 'dark', 'mythical', '🐋', 9400, 1720, 940, [
      s('冥淵重壓', 'basic', 'damage', 1.0), s('虛空壁壘', 'active', 'shield', 0.9, 3, 0.85), s('冥淵吞噬', 'active', 'damage_all', 0.74, 3)])
  ];

  LIGHT_DARK_PETS.forEach(function (entry) { PET_DATA.push(entry); });
}());
