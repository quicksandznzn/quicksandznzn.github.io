import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { render } from '../.build/entry-server.js';

const allPosts = JSON.parse(await readFile('.cache/posts.json', 'utf8'));
const posts = allPosts.map(({ html, text, headings, ...meta }) => meta);
const template = await readFile('dist/index.html', 'utf8');
const site = 'https://quicksandznzn.github.io';
const escape = value => String(value).replace(/[<>&"']/g, char => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' })[char]);
const paths = ['/', '/404.html', ...posts.map(post => `/writing/${post.slug}/`)];
for (const path of paths) {
  const post = allPosts.find(post => path === `/writing/${post.slug}/`);
  const title = post?.title || (path === '/404.html' ? '页面未找到' : 'Focus On Myself');
  const description = post?.description || 'quicksandzn 的个人博客，记录编程、源码阅读与技术实践。';
  const data = { path, posts, ...(post ? { post } : {}) };
  const json = JSON.stringify(data).replaceAll('<', '\\u003c');
  const canonical = new URL(path, site).href;
  const schema = { '@context':'https://schema.org', '@type':post ? 'BlogPosting':'WebSite', name:title, headline:title, description, url:canonical, ...(post ? { datePublished:post.date, author:{ '@type':'Person', name:'quicksandzn' } } : {}) };
  const head = `<meta name="description" content="${escape(description)}"><link rel="canonical" href="${escape(canonical)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="${post ? 'article':'website'}"><meta property="og:url" content="${escape(canonical)}"><meta name="twitter:card" content="summary"><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>${path === '/404.html' ? '<meta name="robots" content="noindex">' : ''}`;
  const html = template.replace('<title>Focus On Myself</title>', `<title>${escape(title)}${path === '/' ? '' : ' | Focus On Myself'}</title>`).replace('<!--page-head-->', head).replace('<!--app-html-->', render(data)).replace('<script id="page-data" type="application/json">null</script>', `<script id="page-data" type="application/json">${json}</script>`);
  const output = path === '/404.html' ? 'dist/404.html' : `dist${path}index.html`;
  await mkdir(dirname(output), { recursive:true }); await writeFile(output, html);
}
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.filter(path => path !== '/404.html').map(path => `<url><loc>${escape(new URL(path, site).href)}</loc></url>`).join('')}</urlset>`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`);
await writeFile('dist/.nojekyll', '');
console.log(`Prerendered ${paths.length} pages and sitemap.`);
