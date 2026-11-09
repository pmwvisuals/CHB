import {templeSites,sitePlacement} from './sanctuary-layout';
import {dockWalkHeight} from './landmark-layout';
export type Quality = 'low' | 'medium' | 'high';
export interface Settings { sensitivity: number; volume: number; quality: Quality; headBob: boolean }
export const defaults: Settings = { sensitivity: 1, volume: .35, quality: 'high', headBob: false };
export const landmarks = [
  { id: 'hill', name: 'Arrival Ridge', subtitle: 'Where your story begins', x: 0, z: 100, text: 'Asterion is a valley of craft, study and devotion to the ancient Greek gods. Travellers follow the ridge to find a home among its sacred temples.' },
  { id: 'house', name: 'The Wayfarer Hall', subtitle: 'A place to come home to', x: -55, z: 42, text: 'Travellers gather at the Wayfarer Hall to exchange maps and stories. Its open reading room offers a quiet place to plan your next walk.' },
  { id: 'cabins', name: 'The Temple Courts', subtitle: 'The heart of the sanctuary', x: 0, z: 0, text: 'The Great Hall anchors the camp. Twelve sacred temples stand in distinct landscapes across the sanctuary, from a lake island to forest clearings and a volcanic terrace. Walk through any temple doorway to explore its statue, offerings and ceremonial architecture. Each hall opens on its own page.' },
  { id: 'lake', name: 'The Mirror Lake', subtitle: 'Still waters, old stories', x: 64, z: 5, text: 'Follow the shore to the open marble pavilion or the timber boat dock. Canoes rock against their moorings, reeds catch the breeze, and the causeway leads to the island sanctuary. Even heroes need somewhere quiet.' },
  { id: 'training', name: 'The Training Grounds', subtitle: 'Discipline before glory', x: -67, z: -20, text: 'A bronze-marked sparring court, three archery lanes and straw practice dummies form the sanctuary’s training yard. Spears and shields wait in the shaded equipment pavilion. Here, patience and practice matter as much as courage.' },
  { id: 'fire', name: 'The Amphitheatre', subtitle: 'An ember of belonging', x: 0, z: -62, text: 'When training ends, residents gather around these flames. For now, listen to the fire and watch the sparks drift into the evening.' },
  { id: 'shrine', name: 'The Forgotten Shrine', subtitle: 'Some paths reward curiosity', x: -40, z: -108, text: 'A small marble shrine rests beneath the forest canopy. Someone has left flowers here. You have found the quietest corner of the sanctuary.' },
] as const;
export const poseidonTemple=sitePlacement('poseidon');
export const temples = [
  ['Zeus', '#d7cbb0', '#55647a', 'ϟ'], ['Hera', '#e9cda8', '#a27560', '♛'], ['Poseidon', '#78ada7', '#376f73', 'Ψ'],
  ['Demeter', '#b5bd72', '#6e7847', '❧'], ['Ares', '#a76149', '#593d39', '⚔'], ['Athena', '#b6b59e', '#6b7565', '◈'],
  ['Apollo', '#e1bc69', '#ab773e', '☀'], ['Artemis', '#a6b9c2', '#4f6776', '☾'], ['Hephaestus', '#977562', '#483d3c', '⚒'],
  ['Aphrodite', '#d9a6a1', '#976872', '♡'], ['Hermes', '#b99a6a', '#76613e', '☤'], ['Dionysus', '#ac9db4', '#6a536d', '❦'],
] as const;
export function groundHeight(x: number, z: number) {
  const base=17*Math.exp(-(x*x/1800+(z-111)**2/430))+.3*Math.sin(x*.035)*Math.sin(z*.03);
  const smooth=(a:number,b:number,t:number)=>{t=Math.max(0,Math.min(1,(t-a)/(b-a)));return t*t*(3-2*t);};
  // Blend softly back to existing foundations, lake and arrival route.
  let influence=smooth(42,54,Math.hypot(x,z));
  for(const [cx,cz,r] of [[-55,50,17],[46,43,18],[-67,-34,20],[0,-62,18],[-40,-108,8],[-40,-121,7],[-76,77,16]])influence*=smooth(r,r+12,Math.hypot(x-cx,z-cz));
  influence*=smooth(1,1.35,((x-91)/37)**2+(z/54)**2);
  influence*=1-smooth(77,94,z)*(1-smooth(12,26,Math.abs(x)));
  const hill=(cx:number,cz:number,height:number,r:number)=>height*Math.exp(-((x-cx)**2+(z-cz)**2)/(r*r));
  const rolls=hill(-30,60,2.8,18)+hill(28,72,3.0,21)+hill(-101,4,3.5,24)+hill(15,-96,3.8,25)+hill(-59,-91,3.1,17)+hill(-20,-105,2.7,15)+hill(101,93,3.6,26)+.5*(1+Math.sin(x*.09)*Math.cos(z*.07));
  // Low grassy knolls within the court, clear of the central walkway and temple steps.
  const court=(hill(-13,-10,.65,6)+hill(13,11,.6,6))*smooth(3,7,Math.abs(x))*(1-smooth(18,24,Math.hypot(x,z)));
  let elevation=base+rolls*influence+court;
  // Broad, gentle approaches flatten into the individual temple terraces.
  for(const [id,s] of Object.entries(templeSites)){if(id==='poseidon')continue;const r=Math.hypot(x-s.x,z-s.z),blend=1-smooth(19,51,r);elevation=elevation*(1-blend)+s.height*blend;}
  const lake=((x-91)/31)**2+(z/47)**2,lakeBlend=1-smooth(.78,1.08,lake);elevation=elevation*(1-lakeBlend)-1.4*lakeBlend;
  // A rounded bank meets the waterline instead of exposing the edge of a flat
  // water disc. The small belvedere terrace blends into the surrounding shore.
  elevation+=.9*Math.exp(-Math.pow((Math.sqrt(lake)-1.04)/.09,2));
  const belvedere=1-smooth(5,9,Math.hypot(x-65,z-35));elevation=elevation*(1-belvedere)+.9*belvedere;
  const island=1-smooth(13.5,17,Math.hypot(x-templeSites.poseidon.x,z-templeSites.poseidon.z));elevation=elevation*(1-island)+templeSites.poseidon.height*island;
  return elevation;
}
export function outdoorWalkHeight(x:number,z:number){if(Math.abs(z-5)<1.8&&x>=55&&x<=84.7)return x<64?(groundHeight(55,5)+.05)*(1-(x-55)/9)+1.15*(x-55)/9:1.15;return dockWalkHeight(x,z,groundHeight)??groundHeight(x,z);}
export function readSave(): { settings: Settings; discoveries: string[] } {
  try {
    const v = JSON.parse(localStorage.getItem('asterion-v1') || localStorage.getItem('half-blood-v1') || '{}');
    const s = v.settings || {};
    return { settings: { sensitivity: Number.isFinite(s.sensitivity) ? Math.max(.25, Math.min(2, s.sensitivity)) : 1, volume: Number.isFinite(s.volume) ? Math.max(0, Math.min(1, s.volume)) : .35, quality: 'high', headBob: s.headBob === true }, discoveries: Array.isArray(v.discoveries) ? v.discoveries.filter((id: unknown) => landmarks.some(l => l.id === id)) : [] };
  } catch { return { settings: defaults, discoveries: [] }; }
}
export function writeSave(settings: Settings, discoveries: string[]) { try { localStorage.setItem('asterion-v1', JSON.stringify({settings, discoveries})); } catch {} }
