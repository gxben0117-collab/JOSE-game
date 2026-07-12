export const ELEMENTS={fire:{name:'火焰',icon:'🔥',color:0xff5a36,strong:'forest'},forest:{name:'森林',icon:'🌿',color:0x55d680,strong:'ocean'},ocean:{name:'海洋',icon:'💧',color:0x47a7ff,strong:'fire'},light:{name:'聖光',icon:'☀️',color:0xffdd76,strong:'dark'},dark:{name:'暗影',icon:'🌙',color:0x9b75ff,strong:'light'}};
export const ROLES=['守護','強攻','治療','控制','支援'];
export const REGIONS=[
 {id:'ember',name:'熾焰群島',icon:'🌋',element:'fire',glow:'#ff633d55',desc:'熔岩潮汐會強化火焰傷害。',rule:'火系傷害 +15%'},
 {id:'verdant',name:'翡翠森境',icon:'🌲',element:'forest',glow:'#5de58a55',desc:'古樹賜福讓治療更加有效。',rule:'治療效果 +20%'},
 {id:'tide',name:'潮汐遺跡',icon:'🌊',element:'ocean',glow:'#55bfff55',desc:'潮汐使能量恢復速度改變。',rule:'每回合額外 +5 能量'},
 {id:'sky',name:'天空神殿',icon:'🏛️',element:'light',glow:'#ffe68755',desc:'光之試煉限制倒下次數。',rule:'全員存活獎勵加倍'},
 {id:'rift',name:'暗影裂谷',icon:'🌌',element:'dark',glow:'#a079ff55',desc:'終局敵人會隨回合增強。',rule:'敵人每回合 +3% 攻擊'}
];
export const MODEL_MAP={
 rabbit:'bunny',lion:'cat',fox:'cat',wolf:'cat',hound:'cat',bear:'dino',boar:'dino',deer:'cat',qilin:'cat',bird:'bird',phoenix:'bird',bat:'bird',fish:'fish',whale:'fish',shark:'fish',eel:'fish',jellyfish:'ghost',crab:'frog',snake:'cactoro',mantis:'cactoro',turtle:'golem',guardian:'golem',treant:'golem',titan:'golem',spirit:'ghost',emperor:'dragon',dragon:'dragon',god:'dragon',beast:'dino',kraken:'ghost',leviathan:'dragon',ball:'frog',starfish:'frog'
};
export function enrichPets(raw){return raw.map((p,i)=>{let key=Object.keys(MODEL_MAP).find(k=>p.id.includes(k))||['frog','cat','bunny','bird','fish','cactoro','golem','ghost','dino','dragon'][i%10];let role=ROLES[i%ROLES.length];let speed=80+(i*13)%55;return {...p,role,speed,model:MODEL_MAP[key]||key,skillEnergy:45+(i%3)*10,branchA:{name:p.name+'・烈',role:'強攻',bonus:'爆發傷害 +25%'},branchB:{name:p.name+'・靈',role:i%2?'支援':'守護',bonus:i%2?'能量恢復 +20%':'生命與防禦 +20%'}}})}
export function stageInfo(regionIndex,stage){let r=REGIONS[regionIndex];let boss=stage===12,elite=stage===6;return {regionIndex,stage,id:r.id+'-'+stage,name:boss?r.name+'守護神':elite?'精英試煉 '+stage:r.name+' '+stage,boss,elite,level:regionIndex*12+stage,element:r.element,energyCost:boss?10:elite?8:6,objectives:['完成關卡','無幻獸倒下',stage%2?'8 回合內勝利':'使用克制屬性']}}
