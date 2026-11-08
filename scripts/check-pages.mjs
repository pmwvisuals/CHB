import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { templeCatalog } from './temple-pages.mjs';
for (const theme of templeCatalog) {
  for (const prefix of ['dist/', '']) {
    const html = await readFile(`${prefix}${theme.id}.html`, 'utf8');
    assert.ok(html.includes(`data-temple="${theme.id}"`), `${prefix}${theme.id} scene identity`);
    assert.ok(html.includes(`<title>${theme.name} · ${theme.title} | Asterion</title>`), `${theme.id} title`);
    const selector = html.match(/<select id="temple-select"[^>]*>(.*?)<\/select>/s)?.[1] || '';
    assert.equal((selector.match(/<option value=/g) || []).length, 12, `${theme.id} selector`);
    assert.ok(html.includes(`value="${theme.id}" selected`), `${theme.id} selected option`);
    assert.ok(html.includes(`href="./${prefix ? 'index' : 'asterion-sanctuary'}.html?return=${theme.id}"`), `${theme.id} return link`);
    if (!prefix) assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)="(?:\.\/)?assets\//, `${theme.id} portable assets`);
  }
}
const main = await readFile('asterion-sanctuary.html', 'utf8');
assert.doesNotMatch(main, /<(?:script|link)[^>]+(?:src|href)="\/assets\//);
console.log('All twelve hosted and portable temple pages pass identity, selector, return-link and asset checks.');
