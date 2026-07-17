/* 全 45 隻幻獸的戰棋與養成資料層。原始名稱、元素與技能仍由 pets.js 提供。 */
var TACTICAL_ROLES = {
  attacker: '\u653b\u64ca\u578b', defender: '\u9632\u79a6\u578b', support: '\u8f14\u52a9\u578b',
  healer: '\u6cbb\u7642\u578b', controller: '\u63a7\u5236\u578b', allrounder: '\u5168\u80fd\u578b'
};

/* 體型：2 = 佔 2×2 格的大型幻獸（龍、巨獸、神獸級）。未列出者為 1×1。 */
var TACTICAL_SIZE_BY_ID = {
  blazing_dragon: 2, crimson_dragon: 2, emerald_dragon: 2, tsunami_dragon: 2, frost_leviathan: 2,
  volcanic_titan: 2, ancient_treant: 2, flame_emperor: 2, forest_god: 2, sea_emperor: 2,
  flame_god_lion: 2, emerald_god_dragon: 2, abyss_god_dragon: 2, sea_god_beast: 2, jade_qilin: 2,
  solar_phoenix: 2, eclipse_dragon: 2, void_leviathan: 2, gold_qilin: 2,
  kiln_rhinoceros: 2, fern_ceratops: 2, mushroom_bison: 2, amber_antler_moose: 2, brine_crocodile: 2,
  aurora_narwhal: 2, cathedral_elephant: 2, crown_unicorn: 2, obsidian_gorilla: 2, abyss_mammoth: 2
};

var TACTICAL_ROLE_BY_ID = {
  molten_ball:'attacker', fire_lion:'defender', fire_fox:'attacker', red_wing_bird:'attacker', lava_crab:'defender', flame_spirit:'support', blazing_dragon:'allrounder', flame_god_lion:'defender', crimson_dragon:'attacker', flame_emperor:'allrounder',
  leaf_ear_rabbit:'healer', grass_bear:'defender', vine_snake:'controller', emerald_bird:'support', moss_turtle:'defender', forest_deer:'healer', emerald_dragon:'allrounder', forest_king:'support', emerald_god_dragon:'controller', forest_god:'allrounder',
  bubble_whale:'support', coral_fish:'healer', starfish_beast:'defender', ice_shark:'attacker', deep_sea_crab:'defender', ice_spirit_fish:'controller', abyss_dragon:'attacker', sea_god_beast:'allrounder', abyss_god_dragon:'controller', sea_emperor:'allrounder',
  lumen_fox:'attacker', radiant_lion:'defender', holy_rabbit:'healer', dawn_deer:'healer', lumina_whale:'support', halo_jelly:'healer', prism_dragon:'allrounder', seraph_treant:'support', gold_qilin:'allrounder', solar_phoenix:'healer',
  night_bat:'controller', abyss_serpent:'controller', hell_hound:'attacker', shadow_fang:'attacker', umbra_bear:'defender', void_crab:'defender', dusk_shark:'attacker', nether_eel:'controller', eclipse_dragon:'allrounder', void_leviathan:'defender',
  emberhorn_beetle:'defender', furnace_owl:'controller', cinder_pangolin:'defender', scarlet_salamander:'attacker', blast_ram:'attacker', coal_mole:'controller', flare_hummingbird:'support', kiln_rhinoceros:'defender', sunscar_scorpion:'controller', comet_tiger:'attacker',
  spore_hedgehog:'healer', bamboo_panda:'defender', orchid_gecko:'controller', acorn_squirrel:'attacker', fern_ceratops:'defender', nectar_moth:'healer', bramble_lynx:'attacker', mushroom_bison:'defender', willow_crane:'healer', amber_antler_moose:'allrounder',
  pearl_seahorse:'support', tidal_axolotl:'healer', glacier_penguin:'controller', nautilus_guardian:'defender', star_tide_ray:'attacker', kelp_otter:'support', geyser_frog:'controller', reef_hammerhead:'attacker', brine_crocodile:'defender', aurora_narwhal:'allrounder',
  prism_peacock:'controller', dawn_griffin:'attacker', halo_capybara:'healer', mirror_armadillo:'defender', star_ram:'support', lantern_koi:'healer', auric_stag_beetle:'attacker', cathedral_elephant:'defender', comet_heron:'controller', crown_unicorn:'allrounder',
  ink_chameleon:'controller', grave_badger:'defender', eclipse_moth:'support', hollow_hyena:'attacker', obsidian_gorilla:'defender', nightmare_tapir:'controller', chain_centipede:'attacker', phantom_raven:'support', void_anglerfish:'controller', abyss_mammoth:'defender',
  magma_hound:'attacker', inferno_bat:'controller', volcanic_titan:'defender', sun_phoenix:'healer', crimson_wolf:'attacker', thorn_boar:'defender', nature_guardian:'support', ancient_treant:'defender', jade_qilin:'allrounder', poison_mantis:'controller', electric_eel:'controller', kraken_spawn:'attacker', frost_leviathan:'defender', tsunami_dragon:'allrounder', crystal_jellyfish:'healer'
};

function tacticalProfile(pet, index) {
  var role = TACTICAL_ROLE_BY_ID[pet.id] || 'allrounder';
  var style = role === 'defender' ? 'melee' : role === 'healer' || role === 'support' ? 'support' : (pet.id.indexOf('bird') >= 0 || pet.id.indexOf('fish') >= 0 || pet.id.indexOf('spirit') >= 0 || pet.id.indexOf('jelly') >= 0 || pet.id.indexOf('eel') >= 0) ? 'ranged' : 'melee';
  var basicStyle = style === 'melee' ? 'melee' : 'ranged';
  var hp = Math.round(pet.baseHp * (role === 'defender' ? 1.18 : role === 'attacker' ? .93 : 1));
  var power = Math.round(pet.baseAtk * (style === 'melee' ? 1.12 : .86));
  var magic = Math.round(pet.baseAtk * (style === 'ranged' || style === 'support' ? 1.18 : .72));
  var defense = Math.round(pet.baseDef * (role === 'defender' ? 1.24 : 1));
  var speed = 4 + ((index * 3 + pet.baseAtk) % 6) + (role === 'attacker' ? 1 : 0);
  var supportEffects = ['heal', 'heal_all', 'shield', 'buff_atk'];
  var actionSkills = pet.skills.filter(function(skill, skillIndex) {
    return skillIndex > 0 && skill.type !== 'passive';
  }).map(function(skill, skillIndex, list) {
    var support = supportEffects.indexOf(skill.effect) >= 0;
    var attackStyle = support ? 'support' : skill.effect === 'damage_all' ? 'area' : style === 'support' ? 'ranged' : style;
    var entry = {
      name: skill.name,
      kind: skillIndex === list.length - 1 ? 'ultimate' : 'active',
      effect: skill.effect,
      multiplier: skill.multiplier || (support ? .9 : 1),
      value: skill.value || 0,
      range: attackStyle === 'melee' ? 1 : attackStyle === 'area' ? 3 : 4,
      radius: attackStyle === 'area' || skill.effect === 'heal_all' ? 1 : 0,
      attackStyle: attackStyle,
      cooldown: skill.cooldown || 0,
      vfxKey: pet.id + '-' + (skillIndex + 1),
      vfxVariant: (index * 7 + skillIndex * 3) % 5,
      vfxHue: (index * 47 + skillIndex * 29 + 12) % 360
    };
    // 控場配置：控制型依元素附加異常，終極技帶拉扯；近戰輸出與防禦型終極技可擊退。
    if (!support) {
      if (role === 'controller') {
        if (entry.kind === 'active') {
          var statusByElement = { ocean: 'freeze', forest: 'poison', fire: 'burn', light: 'burn', dark: 'poison' };
          entry.status = statusByElement[pet.element] || 'burn';
          entry.statusTurns = entry.status === 'freeze' ? 1 : 2;
          if (!entry.cooldown) entry.cooldown = 2;
        } else { entry.pull = 2; if (entry.cooldown < 3) entry.cooldown = 3; }
      } else if (entry.kind === 'ultimate' && attackStyle === 'melee' && (role === 'attacker' || role === 'defender')) {
        entry.push = role === 'defender' ? 2 : 1;
        if (entry.cooldown < 3) entry.cooldown = 3;
      }
    }
    return entry;
  });
  return {
    id: pet.id, name: pet.name, element: pet.element, rarity: pet.quality, role: role, roleLabel: TACTICAL_ROLES[role], attackStyle: style,
    stats: { health: hp, power: power, magic: magic, defense: defense, speed: speed }, move: role === 'attacker' ? 3 : role === 'defender' ? 2 : 3,
    skills: [{ name:'基本攻擊', kind:'basic', effect:'damage', multiplier:.82, range:basicStyle === 'melee' ? 1 : 3, radius:0, attackStyle:basicStyle, cooldown:0, vfxKey:pet.id + '-basic', vfxVariant:index % 5, vfxHue:(index * 47 + 12) % 360 }].concat(actionSkills),
    passives: pet.skills.filter(function(skill) { return skill.type === 'passive'; }).map(function(skill) { return { name:skill.name, effect:skill.effect, value:skill.value || 0, chance:skill.chance || 0 }; }),
    size: TACTICAL_SIZE_BY_ID[pet.id] || 1,
    evolution: [1,2,3].map(function(stage) { return { stage: stage, label: stage === 1 ? '\u5e7c\u9ad4' : stage === 2 ? '\u6210\u9577\u9ad4' : '\u6700\u7d42\u578b', portrait: pet.art || ('assets/pets/' + pet.id + '/evolution/stage_' + stage + '.png') }; }),
    sourceSheet: pet.art || ('assets/sprites/pets/' + pet.id + '-sheet.png')
  };
}

var TACTICAL_PET_DATA = PET_DATA.map(tacticalProfile);
