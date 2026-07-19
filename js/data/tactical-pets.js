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

/* 召喚時的初次契約台詞：每隻幻獸各有一則，不以稀有度共用。 */
var TACTICAL_SUMMON_QUOTES = {
  molten_ball:'吾主，我的火苗雖小，也能照亮前路。', fire_lion:'吾主，炎鬃已為您豎起，誰也不能越過我。', fire_fox:'吾主，鬼火會替您引開所有迷霧。', red_wing_bird:'吾主，請指向天空，我會俯衝到底。', lava_crab:'吾主，這對熔鉗已經熱身完畢。', flame_spirit:'吾主，讓靈焰在我們的誓約中長燃。', blazing_dragon:'吾主，烈焰之翼願與您的旗幟同行。', flame_god_lion:'吾主，神焰不滅，我的守護亦然。', crimson_dragon:'吾主，赤炎的古老血脈向您臣服。', flame_emperor:'吾主，火之王座今日起為您而燃。',
  leaf_ear_rabbit:'吾主，請放心，嫩芽會替大家療癒傷口。', grass_bear:'吾主，我會把最厚的草墊留給夥伴。', vine_snake:'吾主，藤蔓已聽見您的命令。', emerald_bird:'吾主，翠風會把捷報送到您身旁。', moss_turtle:'吾主，慢一點沒關係，我的殼永遠在前面。', forest_deer:'吾主，森林的露水願洗去疲憊。', emerald_dragon:'吾主，翠色龍息將守護這片林地。', forest_king:'吾主，萬木已向您低頭致意。', emerald_god_dragon:'吾主，古森的意志將與您一同甦醒。', forest_god:'吾主，林海無盡，而我為您開路。',
  bubble_whale:'吾主，泡泡裡藏著我們的好運氣。', coral_fish:'吾主，珊瑚的歌聲會為隊伍療傷。', starfish_beast:'吾主，海星的每一角都準備好迎敵。', ice_shark:'吾主，獵物的氣息已在冰海中凝結。', deep_sea_crab:'吾主，深海的甲殼從不後退。', ice_spirit_fish:'吾主，請讓寒潮替您封住敵人的腳步。', abyss_dragon:'吾主，深淵並不可怕，因為我已歸來。', sea_god_beast:'吾主，潮汐會在您揮手時改變方向。', abyss_god_dragon:'吾主，海溝最深處的誓言只獻給您。', sea_emperor:'吾主，萬頃碧波願為您的遠征讓路。',
  magma_hound:'吾主，熔岩的氣味已帶我找到您。', inferno_bat:'吾主，黑夜裡的火翼聽候差遣。', volcanic_titan:'吾主，山脈醒來了；請把戰場交給我。', sun_phoenix:'吾主，若我墜落，也會為您再度重生。', crimson_wolf:'吾主，狼群的第一聲長嚎獻給您。', thorn_boar:'吾主，荊棘已纏滿我的獠牙。', nature_guardian:'吾主，草木的呼吸將護住每位同伴。', ancient_treant:'吾主，年輪記得所有誓言，包括今天。', jade_qilin:'吾主，翠玉之蹄將踏平不義之路。', poison_mantis:'吾主，目標已鎖定，請欣賞我的刀舞。', electric_eel:'吾主，雷光會在敵陣最深處綻放。', kraken_spawn:'吾主，深海的巨腕願替您撕開浪牆。', frost_leviathan:'吾主，冰封的王者將為您鎮守前線。', tsunami_dragon:'吾主，一聲令下，我便掀起改變世界的潮。', crystal_jellyfish:'吾主，水晶微光會讓傷痛變得透明。',
  lumen_fox:'吾主，聖光指引我穿越漫長的夜。', radiant_lion:'吾主，耀光的怒吼將驅散恐懼。', holy_rabbit:'吾主，我帶來晨曦與一點勇氣。', dawn_deer:'吾主，請收下這束不會凋謝的曙光。', lumina_whale:'吾主，星海的回音正在回應您的召喚。', halo_jelly:'吾主，柔和的光環會罩住每一位朋友。', prism_dragon:'吾主，七色龍鱗願折射出勝利的道路。', seraph_treant:'吾主，曙光枝枒會為您撐起庇蔭。', gold_qilin:'吾主，黃金誓約已由我的角尖刻下。', solar_phoenix:'吾主，太陽升起之處，就是我效忠之地。',
  night_bat:'吾主，夜色是我的披風，也是您的耳目。', abyss_serpent:'吾主，陰影不會欺騙真正的契約者。', hell_hound:'吾主，冥獄之門已在我腳下開啟。', shadow_fang:'吾主，月光熄滅時就是我出手的時刻。', umbra_bear:'吾主，暗爪會替您擋下最沉重的一擊。', void_crab:'吾主，虛空硬殼從不畏懼巨浪。', dusk_shark:'吾主，黃昏海域的獵手已游向敵陣。', nether_eel:'吾主，冥雷會替您的意志傳遍黑暗。', eclipse_dragon:'吾主，蝕月之翼遮天，只為護您周全。', void_leviathan:'吾主，深淵之王已接受您的召令。',
  emberhorn_beetle:'吾主，燼角雖鈍，也能撞開一條路。', furnace_owl:'吾主，爐火未熄，我的雙眼也不會閉上。', cinder_pangolin:'吾主，我的鱗甲已燒得發亮，請放心前進。', scarlet_salamander:'吾主，赤煉的尾焰會替您留下記號。', blast_ram:'吾主，倒數結束後，讓我先撞出缺口。', coal_mole:'吾主，地下的暗道我已替您探明。', flare_hummingbird:'吾主，請看好，微小翅膀也能點燃戰局。', kiln_rhinoceros:'吾主，爐岩之角會把防線推得更遠。', sunscar_scorpion:'吾主，日痕之毒只會刺向您的敵人。', comet_tiger:'吾主，彗焰掠空之時，勝利便會降臨。',
  spore_hedgehog:'吾主，孢芽會在最需要的地方開花。', bamboo_panda:'吾主，交給我吧，我的竹鎧很可靠。', orchid_gecko:'吾主，牆上的蘭影已替您看清四周。', acorn_squirrel:'吾主，我把橡果和勇氣都帶來了。', fern_ceratops:'吾主，蕨角的衝鋒絕不會偏離目標。', nectar_moth:'吾主，蜜露灑下時，疲憊會悄悄離開。', bramble_lynx:'吾主，荊棘中的腳步聲就是我的訊號。', mushroom_bison:'吾主，菇冠之下藏著足以撼地的力量。', willow_crane:'吾主，柳風會托住每一次飛翔。', amber_antler_moose:'吾主，琥珀記住了我們相遇的這一刻。',
  pearl_seahorse:'吾主，珍珠鎧甲已擦亮，隨時可以出航。', tidal_axolotl:'吾主，潮汐會把我們帶往正確的岸邊。', glacier_penguin:'吾主，冰面再滑，我也不會讓隊伍跌倒。', nautilus_guardian:'吾主，螺旋之盾將替您擋住所有浪頭。', star_tide_ray:'吾主，星潮的軌跡正指向敵人的弱點。', kelp_otter:'吾主，海藻裡的祕密就交給我打聽。', geyser_frog:'吾主，下一躍會比噴泉更高。', reef_hammerhead:'吾主，礁岩粉碎前，我絕不轉身。', brine_crocodile:'吾主，鹽潮的利齒已經飢渴難耐。', aurora_narwhal:'吾主，極光將為您的航路點亮長夜。',
  prism_peacock:'吾主，稜光展翼，真相無處可藏。', dawn_griffin:'吾主，曙光與獅心會一同守在您身邊。', halo_capybara:'吾主，別緊張，先深呼吸，交給我吧。', mirror_armadillo:'吾主，鏡甲會把敵人的攻勢原樣奉還。', star_ram:'吾主，星冠已對準衝鋒的方向。', lantern_koi:'吾主，我會提著燈星照亮每條水路。', auric_stag_beetle:'吾主，金色甲角已為榮耀而鳴。', cathedral_elephant:'吾主，聖堂般的意志不容任何人撼動。', comet_heron:'吾主，彗星落點已由我精準標記。', crown_unicorn:'吾主，王冠之光只為忠誠的您閃耀。',
  ink_chameleon:'吾主，墨影變幻，但我的忠心不變。', grave_badger:'吾主，墓土之下也藏不住敵人的行蹤。', eclipse_moth:'吾主，月蝕的粉塵會讓敵人迷失方向。', hollow_hyena:'吾主，空洞的笑聲將先一步瓦解對手。', obsidian_gorilla:'吾主，黑曜之拳會為您擊碎高牆。', nightmare_tapir:'吾主，讓敵人在夢裡先學會恐懼。', chain_centipede:'吾主，鎖鏈每一節都聽從您的意志。', phantom_raven:'吾主，幽相之羽會帶回無人知曉的情報。', void_anglerfish:'吾主，虛空微燈已引來獵物。', abyss_mammoth:'吾主，深淵的重蹄將替您踏出新紀元。'
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
    id: pet.id, name: pet.name, element: pet.element, rarity: pet.quality, role: role, roleLabel: TACTICAL_ROLES[role], attackStyle: style, summonQuote: TACTICAL_SUMMON_QUOTES[pet.id],
    stats: { health: hp, power: power, magic: magic, defense: defense, speed: speed }, move: role === 'attacker' ? 3 : role === 'defender' ? 2 : 3,
    skills: [{ name:'基本攻擊', kind:'basic', effect:'damage', multiplier:.82, range:basicStyle === 'melee' ? 1 : 3, radius:0, attackStyle:basicStyle, cooldown:0, vfxKey:pet.id + '-basic', vfxVariant:index % 5, vfxHue:(index * 47 + 12) % 360 }].concat(actionSkills),
    passives: pet.skills.filter(function(skill) { return skill.type === 'passive'; }).map(function(skill) { return { name:skill.name, effect:skill.effect, value:skill.value || 0, chance:skill.chance || 0 }; }),
    size: TACTICAL_SIZE_BY_ID[pet.id] || 1,
    evolution: [1,2,3].map(function(stage) { return { stage: stage, label: stage === 1 ? '\u5e7c\u9ad4' : stage === 2 ? '\u6210\u9577\u9ad4' : '\u6700\u7d42\u578b', portrait: pet.art || ('assets/pets/' + pet.id + '/evolution/stage_' + stage + '.png') }; }),
    sourceSheet: pet.art || ('assets/sprites/pets/' + pet.id + '-sheet.png')
  };
}

var TACTICAL_PET_DATA = PET_DATA.map(tacticalProfile);
