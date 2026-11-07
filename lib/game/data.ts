export type Quality = 'low' | 'medium' | 'high';
export interface Settings { sensitivity: number; volume: number; quality: Quality; headBob: boolean }
export const defaults: Settings = { sensitivity: 1, volume: .35, quality: 'medium', headBob: false };
export const landmarks = [
  { id: 'hill', name: 'Arrival Ridge', subtitle: 'Where your story begins', x: 0, z: 100, text: 'Asterion is a valley of craft, study and devotion to the ancient Greek gods. Travellers follow the ridge to find a home among its residential temples.' },
  { id: 'house', name: 'The Wayfarer Hall', subtitle: 'A place to come home to', x: -55, z: 42, text: 'Travellers gather at the Wayfarer Hall to exchange maps and stories. Its open reading room offers a quiet place to plan your next walk.' },
  { id: 'cabins', name: 'The Temple Courts', subtitle: 'Find where you belong', x: 0, z: 0, text: 'Follow the eastern path to Poseidon’s Hall of the Tides: twin reflecting pools, an open colonnade and warm living quarters. The other temple residences are early designs, awaiting their own transformation.' },
  { id: 'lake', name: 'The Mirror Lake', subtitle: 'Still waters, old stories', x: 64, z: 5, text: 'Reeds whisper along the water and canoes wait by the dock. Take a moment at the end of the pier; even heroes need somewhere quiet.' },
  { id: 'fire', name: 'The Amphitheatre', subtitle: 'An ember of belonging', x: 0, z: -62, text: 'When training ends, residents gather around these flames. For now, listen to the fire and watch the sparks drift into the evening.' },
  { id: 'shrine', name: 'The Forgotten Shrine', subtitle: 'Some paths reward curiosity', x: -40, z: -108, text: 'A small marble shrine rests beneath the forest canopy. Someone has left flowers here. You have found the quietest corner of the sanctuary.' },
] as const;
export const poseidonTemple = { x: Math.sin(5*Math.PI/12)*39, z: Math.cos(5*Math.PI/12)*39, rotation: -7*Math.PI/12 };
export const temples = [
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
    const v = JSON.parse(localStorage.getItem('asterion-v1') || localStorage.getItem('half-blood-v1') || '{}');
    const s = v.settings || {};
    return { settings: { sensitivity: Number.isFinite(s.sensitivity) ? Math.max(.25, Math.min(2, s.sensitivity)) : 1, volume: Number.isFinite(s.volume) ? Math.max(0, Math.min(1, s.volume)) : .35, quality: ['low','medium','high'].includes(s.quality) ? s.quality : 'medium', headBob: s.headBob === true }, discoveries: Array.isArray(v.discoveries) ? v.discoveries.filter((id: unknown) => landmarks.some(l => l.id === id)) : [] };
  } catch { return { settings: defaults, discoveries: [] }; }
}
export function writeSave(settings: Settings, discoveries: string[]) { try { localStorage.setItem('asterion-v1', JSON.stringify({settings, discoveries})); } catch {} }
