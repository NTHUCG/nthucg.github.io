const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const version = name => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex').slice(0, 10);
const css = version('style.css');
const js = version('script.js');
for (const name of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const file = path.join(root, name);
  const source = fs.readFileSync(file, 'utf8');
  const updated = source.replace(/href="style\.css(?:\?[^"\s]*)?"/g, `href="style.css?v=${css}"`)
    .replace(/src="script\.js(?:\?[^"\s]*)?"/g, `src="script.js?v=${js}"`);
  if (updated !== source) fs.writeFileSync(file, updated);
}
console.log(`Asset versions updated: CSS ${css}, JS ${js}`);