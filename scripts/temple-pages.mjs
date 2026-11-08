import { templeCatalog } from '../lib/game/temple-catalog.ts';
export { templeCatalog };
export function templePage(template,theme){
 const index=templeCatalog.findIndex(t=>t.id===theme.id)+1;
 return template.replace('<body>',`<body data-temple="${theme.id}" style="--temple-accent:${theme.accent};--temple-metal:${theme.metal}">`)
 .replace('Poseidon · The Sacred Hall',`${theme.name} · ${theme.title}`)
 .replaceAll('?return=poseidon',`?return=${theme.id}`)
 .replace('POSEIDON <i>Lord of the Sea</i>',`${theme.name.toUpperCase()} <i>${theme.epithet}</i>`)
 .replace('ASTERION SANCTUARY / TEMPLE I',`ASTERION SANCTUARY / TEMPLE ${String(index).padStart(2,'0')}`)
 .replace('The hall<br>of <em>Poseidon.</em>',`The hall<br>of <em>${theme.name}.</em>`)
 .replace('Beneath the bronze gaze of the sea god.<br>Stone, offerings, and the quiet weight of devotion.',theme.description)
 .replace('<p class="hint">',`<label class="temple-switch">VISIT ANOTHER TEMPLE <select id="temple-select" aria-label="Choose a temple">${templeCatalog.map(t=>`<option value="${t.id}"${t.id===theme.id?' selected':''}>${t.name} — ${t.title}</option>`).join('')}</select></label><p class="hint">`);
}
