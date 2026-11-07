export type Quality = 'low' | 'medium' | 'high';
export interface Settings { sensitivity: number; volume: number; quality: Quality; headBob: boolean }
export const defaults: Settings = { sensitivity: 1, volume: .35, quality: 'medium', headBob: false };
export const landmarks = [
  { id: 'hill', name: 'Half-Blood Hill', subtitle: 'Where your story begins', x: 0, z: 100, text: 'Beyond this pine, the ordinary world falls away. The valley below is a sanctuary for the children of the Greek gods.' },
  { id: 'house', name: 'The Big House', subtitle: 'A place to come home to', x: -55, z: 42, text: 'Blue clapboard, a quiet porch, and a thousand untold stories. Camp life begins at the Big House. Step inside and explore the ground floor.' },
  { id: 'cabins', name: 'The Twelve Cabins', subtitle: 'Find where you belong', x: 0, z: 0, text: 'Twelve cabins circle the green, each carrying the character of a god. The sea-green Poseidon cabin and olive-coloured Athena cabin are open to visitors.' },
  { id: 'lake', name: 'The Canoe Lake', subtitle: 'Still waters, old stories', x: 64, z: 5, text: 'Reeds whisper along the water and canoes wait by the dock. Take a moment at the end of the pier; even heroes need somewhere quiet.' },
  { id: 'fire', name: 'The Amphitheatre', subtitle: 'An ember of belonging', x: 0, z: -62, text: 'When training ends, campers gather around these flames. For now, listen to the fire and watch the sparks drift into the evening.' },
  { id: 'shrine', name: 'The Forgotten Shrine', subtitle: 'Some paths reward curiosity', x: -40, z: -108, text: 'A small marble shrine rests beneath the forest canopy. Someone has left flowers here. You have found the quietest corner of camp.' },
] as const;
export const cabins = [
  ['Zeus', '#d7cbb0', '#55647a', 'ϟ'], ['Hera', '#e9cda8', '#a27560', '♛'], ['Poseidon', '#78ada7', '#376f73', 'Ψ'],
  ['Demeter', '#b5bd72', '#6e7847', '❧'], ['Ares', '#a76149', '#593d39', '⚔'], ['Athena', '#b6b59e', '#6b7565', '◈'],
  ['Apollo', '#e1bc69', '#ab773e', '☀'], ['Artemis', '#a6b9c2', '#4f6776', '☾'], ['Hephaestus', '#977562', '#483d3c', '⚒'],
  ['Aphrodite', '#d9a6a1', '#976872', '♡'], ['Hermes', '#b99a6a', '#76613e', '☤'], ['Dionysus', '#ac9db4', '#6a536d', '❦'],
] as const;
export function groundHeight(x: number, z: number) {
  return 17 * Math.exp(-((x*x)/1800 + ((z-111)*(z-111))/430)) + .3 * Math.sin(x*.035) * Math.sin(z*.03);
}
export function readSave(): { settings: Settings; discoveries: string[] } {
  try {
    const v = JSON.parse(localStorage.getItem('half-blood-v1') || '{}');
    const s = v.settings || {};
    return { settings: { sensitivity: Number.isFinite(s.sensitivity) ? Math.max(.25, Math.min(2, s.sensitivity)) : 1, volume: Number.isFinite(s.volume) ? Math.max(0, Math.min(1, s.volume)) : .35, quality: ['low','medium','high'].includes(s.quality) ? s.quality : 'medium', headBob: s.headBob === true }, discoveries: Array.isArray(v.discoveries) ? v.discoveries.filter((id: unknown) => landmarks.some(l => l.id === id)) : [] };
  } catch { return { settings: defaults, discoveries: [] }; }
}
export function writeSave(settings: Settings, discoveries: string[]) { try { localStorage.setItem('half-blood-v1', JSON.stringify({settings, discoveries})); } catch {} }
