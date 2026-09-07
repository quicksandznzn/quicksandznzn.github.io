import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';

const posts = JSON.parse(await readFile('.cache/posts.json', 'utf8'));
assert(posts.length > 0, 'At least one article must be published');
assert.equal(new Set(posts.map(post => post.slug)).size, posts.length, 'Unique article routes');

const files = (await readdir('dist', { recursive: true })).filter(file => file.endsWith('.html'));
let references = 0;
for (const file of files) {
  const html = await readFile(`dist/${file}`, 'utf8');
  if (!html.includes('id="root"')) continue; // Existing domain-verification files are intentionally plain.
  assert(!html.includes('<!--app-html-->'), `${file} must be prerendered`);
  assert.match(html, /<h1\b/, `${file} needs a server-rendered heading`);
  assert.match(html, /<link rel="canonical"/, `${file} needs a canonical URL`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, `${file}: duplicate IDs`);
  for (const [, value] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (value.startsWith('#')) { assert(ids.includes(decodeURIComponent(value.slice(1))), `${file}: missing anchor ${value}`); continue; }
    if (!value.startsWith('/') || value.startsWith('//')) continue;
    const path = decodeURIComponent(value.split(/[?#]/)[0]);
    const target = `dist${path}${path.endsWith('/') ? 'index.html' : ''}`;
    assert((await stat(target).catch(() => null))?.isFile(), `${file}: missing local resource ${value}`);
    references++;
  }
}
for (const post of posts) {
  const html = await readFile(`dist/writing/${post.slug}/index.html`, 'utf8');
  assert(html.includes(post.title.replaceAll('&', '&amp;')), `Article title: ${post.slug}`);
  for (const heading of post.headings) assert(html.includes(`id="${heading.id}"`), `Article heading: ${heading.id}`);
}
const home = await readFile('dist/index.html', 'utf8');
assert(!home.includes('alpine') && !home.includes('PaperMod') && !home.includes('astro'));
const cssFile = (await readdir('dist/assets')).find(file => file.endsWith('.css'));
const css = await readFile(`dist/assets/${cssFile}`, 'utf8');
assert(css.includes('@layer'), 'StyleX CSS must be emitted');
assert(css.includes('--page'), 'StyleX design tokens must be emitted');
console.log(`Checked ${posts.length} articles, ${files.length} HTML files, and ${references} local links/assets.`);
