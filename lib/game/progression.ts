export type EnemyKind='wolf'|'crawler';
export interface EnemyState {id:string;kind:EnemyKind;x:number;z:number;homeX:number;homeZ:number;hp:number;timer:number;phase:'patrol'|'chase'|'windup'|'recover'|'dead'}
export interface ExpeditionState {id:number;x:number;z:number;yaw:number;hp:number;stamina:number;coins:number;materials:number;chest:boolean;supplies:boolean;insight:number;cooldown:number;enemies:EnemyState[]}
export interface PlayerProfile {version:1;revision:number;xp:number;coins:number;materials:number;potions:number;sword:0|1|2;quest:number;accepted:boolean;kills:number;supplies:boolean;fragment:boolean;gift:boolean;returns:number;run:ExpeditionState|null}
export const quests=[
 {title:'The Missing Supplies',text:'Recover the supply satchel near the fallen column, then return to the sanctuary.',xp:60,coins:20},
 {title:'A Trail Worth Keeping',text:'Defeat three creatures after accepting this quest. Return to unlock Athena’s Insight.',xp:100,coins:30},
 {title:'The First Ward',text:'Defeat the shrine guardian and recover the ward fragment from its chest.',xp:150,coins:50}
];
export const newProfile=():PlayerProfile=>({version:1,revision:0,xp:0,coins:0,materials:0,potions:3,sword:0,quest:0,accepted:false,kills:0,supplies:false,fragment:false,gift:false,returns:0,run:null});
export function level(p:PlayerProfile){return Math.min(5,1+Math.floor(Math.sqrt(p.xp/50)));}
export function questReady(p:PlayerProfile){return p.accepted&&(p.quest===0?p.supplies:p.quest===1?p.kills>=3:p.quest===2?p.fragment:false);}
export function claimQuest(p:PlayerProfile){if(p.run||!questReady(p))return false;const q=quests[p.quest];p.xp+=q.xp;p.coins+=q.coins;p.quest++;p.accepted=false;return true;}
export function acceptQuest(p:PlayerProfile){if(p.quest>=quests.length||p.accepted||p.run)return false;p.accepted=true;if(p.quest===1)p.kills=0;return true;}
export function buy(p:PlayerProfile,item:'potion'|'sword'){if(p.run)return false;const cost=item==='potion'?10:p.sword===0?40:80;if(p.coins<cost||(item==='sword'&&p.sword===2)||(item==='potion'&&p.potions>=9))return false;p.coins-=cost;if(item==='potion')p.potions++;else p.sword=(p.sword+1) as 1|2;return true;}
export function claimGift(p:PlayerProfile){if(p.run||p.gift||p.returns<1)return false;p.gift=true;p.coins+=20;p.potions=Math.min(9,p.potions+2);return true;}
export function beginExpedition(p:PlayerProfile){if(p.run)return p.run;const positions:[number,number,EnemyKind][]=[[-29,-88,'wolf'],[-54,-88,'crawler'],[-25,-109,'wolf'],[-54,-112,'wolf'],[-40,-115,'crawler']];p.run={id:p.returns+1,x:-40,z:-73,yaw:0,hp:100,stamina:100,coins:0,materials:0,chest:false,supplies:false,insight:0,cooldown:0,enemies:positions.map(([x,z,kind],i)=>({id:'enemy-'+i,kind,x,z,homeX:x,homeZ:z,hp:kind==='wolf'?60:100,timer:0,phase:'patrol'}))};return p.run;}
export function rewardEnemy(p:PlayerProfile,e:EnemyState){if(!p.run||e.phase==='dead'||e.hp>0)return false;e.phase='dead';p.xp+=e.kind==='wolf'?20:35;p.run.coins+=e.kind==='wolf'?5:8;p.run.materials++;if(p.accepted&&p.quest===1)p.kills++;return true;}
export function finishExpedition(p:PlayerProfile,defeated=false){if(!p.run)return false;const r=p.run;p.coins+=Math.floor(r.coins*(defeated?.75:1));p.materials+=Math.floor(r.materials*(defeated?.75:1));if(!defeated)p.returns++;p.run=null;return true;}
const KEY='asterion-profile-v1';let storageFailure='';
export function validateProfile(v:unknown):PlayerProfile {
 if(!v||typeof v!=='object')throw Error('Invalid save');const p=v as PlayerProfile;
 if(p.version!==1)throw Error('Unsupported save version');
 for(const k of ['revision','xp','coins','materials','potions','sword','quest','kills','returns'] as const)if(!Number.isSafeInteger(p[k])||p[k]<0||p[k]>1e8)throw Error('Invalid '+k);
 if(p.potions>9||p.sword>2||p.quest>3)throw Error('Invalid inventory or quest');
 for(const k of ['accepted','supplies','fragment','gift'] as const)if(typeof p[k]!=='boolean')throw Error('Invalid '+k);
 if(p.run){const r=p.run;if(!Array.isArray(r.enemies)||r.enemies.length!==5)throw Error('Invalid expedition');for(const k of ['id','x','z','yaw','hp','stamina','coins','materials','insight','cooldown'] as const)if(!Number.isFinite(r[k]))throw Error('Invalid expedition '+k);if(r.hp<0||r.hp>100||r.stamina<0||r.stamina>100||r.coins<0||r.materials<0)throw Error('Invalid expedition values');for(const e of r.enemies)if(!['wolf','crawler'].includes(e.kind)||!['patrol','chase','windup','recover','dead'].includes(e.phase)||![e.x,e.z,e.homeX,e.homeZ,e.hp,e.timer].every(Number.isFinite))throw Error('Invalid creature');}
 return structuredClone(p);
}
export function readProfile(){try{const raw=localStorage.getItem(KEY);return raw?validateProfile(JSON.parse(raw)):newProfile();}catch{storageFailure='Progress could not be read. Export your current progress before closing.';return newProfile();}}
export function saveProfile(p:PlayerProfile){try{p.revision++;localStorage.setItem(KEY,JSON.stringify(validateProfile(p)));storageFailure='';return true;}catch{storageFailure='Progress could not be saved. Export a backup before closing this page.';return false;}}
export const saveWarning=()=>storageFailure;
export function importProfile(raw:string){const p=validateProfile(JSON.parse(raw));if(!saveProfile(p))throw Error(saveWarning());return p;}
