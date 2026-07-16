/* 全 45 隻幻獸的戰棋與養成資料層。原始名稱、元素與技能仍由 pets.js 提供。 */
var TACTICAL_ROLES = {
  attacker: '\u653b\u64ca\u578b', defender: '\u9632\u79a6\u578b', support: '\u8f14\u52a9\u578b',
  healer: '\u6cbb\u7642\u578b', controller: '\u63a7\u5236\u578b', allrounder: '\u5168\u80fd\u578b'
};

var TACTICAL_ROLE_BY_ID = {
  molten_ball:'attacker', fire_lion:'defender', fire_fox:'attacker', red_wing_bird:'attacker', lava_crab:'defender', flame_spirit:'support', blazing_dragon:'allrounder', flame_god_lion:'defender', crimson_dragon:'attacker', flame_emperor:'allrounder',
  leaf_ear_rabbit:'healer', grass_bear:'defender', vine_snake:'controller', emerald_bird:'support', moss_turtle:'defender', forest_deer:'healer', emerald_dragon:'allrounder', forest_king:'support', emerald_god_dragon:'controller', forest_god:'allrounder',
  bubble_whale:'support', coral_fish:'healer', starfish_beast:'defender', ice_shark:'attacker', deep_sea_crab:'defender', ice_spirit_fish:'controller', abyss_dragon:'attacker', sea_god_beast:'allrounder', abyss_god_dragon:'controller', sea_emperor:'allrounder',
  magma_hound:'attacker', inferno_bat:'controller', volcanic_titan:'defender', sun_phoenix:'healer', crimson_wolf:'attacker', thorn_boar:'defender', nature_guardian:'support', ancient_treant:'defender', jade_qilin:'allrounder', poison_mantis:'controller', electric_eel:'controller', kraken_spawn:'attacker', frost_leviathan:'defender', tsunami_dragon:'allrounder', crystal_jellyfish:'healer'
};

function tacticalProfile(pet, index) {
  var role = TACTICAL_ROLE_BY_ID[pet.id] || 'allrounder';
  var style = role === 'defender' ? 'melee' : role === 'healer' || role === 'support' ? 'support' : (pet.id.indexOf('bird') >= 0 || pet.id.indexOf('fish') >= 0 || pet.id.indexOf('spirit') >= 0 || pet.id.indexOf('jelly') >= 0 || pet.id.indexOf('eel') >= 0) ? 'ranged' : 'melee';
  var hp = Math.round(pet.baseHp * (role === 'defender' ? 1.18 : role === 'attacker' ? .93 : 1));
  var power = Math.round(pet.baseAtk * (style === 'melee' ? 1.12 : .86));
  var magic = Math.round(pet.baseAtk * (style === 'ranged' || style === 'support' ? 1.18 : .72));
  var defense = Math.round(pet.baseDef * (role === 'defender' ? 1.24 : 1));
  var speed = 4 + ((index * 3 + pet.baseAtk) % 6) + (role === 'attacker' ? 1 : 0);
  return {
    id: pet.id, name: pet.name, element: pet.element, rarity: pet.quality, role: role, roleLabel: TACTICAL_ROLES[role], attackStyle: style,
    stats: { health: hp, power: power, magic: magic, defense: defense, speed: speed }, move: role === 'attacker' ? 3 : role === 'defender' ? 2 : 3,
    skills: pet.skills.map(function(skill, skillIndex) { return { name: skill.name, kind: skillIndex === 0 ? 'normal' : skillIndex === 3 ? 'ultimate' : 'active', effect: skill.effect, multiplier: skill.multiplier || 0, range: style === 'melee' ? 1 : style === 'ranged' ? 4 : 3, attackStyle: skill.effect === 'heal' || skill.effect === 'shield' || skill.effect === 'buff_atk' ? 'support' : skill.effect === 'damage_all' ? 'area' : style, cooldown: skill.cooldown || 0, vfxKey: pet.id + '-' + skillIndex, vfxVariant: (index * 7 + skillIndex * 3) % 5, vfxHue: (index * 47 + skillIndex * 29 + 12) % 360 }; }),
    evolution: [1,2,3].map(function(stage) { return { stage: stage, label: stage === 1 ? '\u5e7c\u9ad4' : stage === 2 ? '\u6210\u9577\u9ad4' : '\u6700\u7d42\u578b', portrait: 'assets/pets/' + pet.id + '/evolution/stage_' + stage + '.png', motion: 'assets/pets/' + pet.id + '/stage_' + stage + '/battle/motion.png', vfx: 'assets/pets/' + pet.id + '/stage_' + stage + '/vfx/skill.png' }; }),
    sourceSheet: 'assets/sprites/pets/' + pet.id + '-sheet.png'
  };
}

var TACTICAL_PET_DATA = PET_DATA.map(tacticalProfile);
