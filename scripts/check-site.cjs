const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const hash = name => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex').slice(0, 10);
let previews = 0;
for (const name of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `${name}: expected one main heading`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${name}: duplicate IDs`);
  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    const url = match[1];
    if (/^(?:[a-z]+:|\/\/)/i.test(url)) continue;
    const [file, fragment] = url.split('#');
    const pathname = decodeURIComponent(file.split('?')[0]);
    if (pathname) assert.ok(fs.existsSync(path.join(root, pathname)), `${name}: missing ${pathname}`);
    else if (fragment) assert.ok(ids.includes(fragment), `${name}: missing #${fragment}`);
  }
  for (const image of html.matchAll(/<img\b[^>]*>/g)) assert.match(image[0], /\balt="[^"]*"/, `${name}: missing image alt`);
  assert.ok(!html.includes('<iframe'), `${name}: players must load on demand`);
  assert.ok(html.includes(`style.css?v=${hash('style.css')}`), `${name}: stale CSS version`);
  if (html.includes('src="script.js')) assert.ok(html.includes(`script.js?v=${hash('script.js')}`), `${name}: stale JS version`);
  const videoIds = [...html.matchAll(/data-video-id="([^"]+)"/g)].map(match => match[1]);
  for (const id of videoIds) assert.match(id, /^[\w-]{11}$/, `${name}: malformed video ID`);
  assert.equal(new Set(videoIds).size, videoIds.length, `${name}: duplicate video`);
  previews += videoIds.length;
  console.log(`${name}: local assets, anchors, headings, image alt, video IDs and versions OK`);
}
assert.ok(!fs.readFileSync(path.join(root, 'style.css'), 'utf8').includes('@import'), 'Avoid blocking font imports');
console.log(`Static checks passed; ${previews} on-demand video previews.`);