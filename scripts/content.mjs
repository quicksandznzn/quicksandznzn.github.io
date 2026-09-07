import { existsSync } from 'node:fs';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { createHighlighter } from 'shiki';

const highlighter = await createHighlighter({ themes: ['github-light', 'github-dark'], langs: ['java', 'javascript', 'json', 'bash', 'python', 'xml', 'yaml', 'sql', 'text', 'properties'] });
const files = await readdir('content/posts', { recursive: true });
const posts = [];
for (const file of files.filter(file => file.endsWith('.md'))) {
  const { data, content } = matter((await readFile(`content/posts/${file}`, 'utf8')).trimStart());
  if (data.draft || new Date(data.date) > new Date()) continue;
  if (typeof data.title !== 'string' || !Number.isFinite(+new Date(data.date))) throw new Error(`Invalid title or date: ${file}`);
  const slug = file.split('/').at(-1).replace(/\.md$/, '').replaceAll('_', '-');
  if (posts.some(post => post.slug === slug)) throw new Error(`Duplicate slug: ${slug}`);
  const headings = []; const used = new Map();
  const markdown = new Marked({ gfm: true, renderer: {
    image({ href, text }) {
      const escape = value => value.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
      if (href.startsWith('/image/') && !existsSync(`static${href}`)) {
        console.warn(`Missing original image: ${href}`);
        return '<p role="note">原文配图暂缺。</p>';
      }
      return `<img src="${escape(href)}" alt="${escape(text === 'showcase' ? data.title + ' 配图' : text)}" loading="lazy" decoding="async">`;
    },
    heading({ tokens, depth }) {
      const title = this.parser.parseInline(tokens);
      const text = title.replace(/<[^>]*>/g, '');
      const base = text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-') || 'section';
      const count = used.get(base) || 0; used.set(base, count + 1);
      const id = count ? `${base}-${count}` : base;
      headings.push({ id, text, depth });
      return `<h${depth} id="${id}">${title}</h${depth}>`;
    },
    code({ text, lang }) {
      const language = ({ shell: 'bash', sh: 'bash', yml: 'yaml' })[lang] || lang || 'text';
      return highlighter.codeToHtml(text, { lang: highlighter.getLoadedLanguages().includes(language) ? language : 'text', themes: { light: 'github-light', dark: 'github-dark' } });
    },
  } });
  // Content is trusted local Markdown authored by the site owner, including existing HTML embeds.
  const html = await markdown.parse(content.replaceAll('https://quicksandznzn.github.io/image/', '/image/').replace(/<iframe /g, '<iframe title="文章参考 PDF" loading="lazy" '));
  posts.push({ slug, title: data.title, description: data.description || '', date: new Date(data.date).toISOString().slice(0, 10), categories: data.categories || [], tags: data.tags || [], minutes: Math.max(1, Math.ceil((content.match(/[\p{Script=Han}]|[\p{L}\p{N}_]+/gu)?.length || 0) / 300)), html, headings, text: content });
}
highlighter.dispose();
posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
await mkdir('.cache', { recursive: true });
await writeFile('.cache/posts.json', JSON.stringify(posts));
console.log(`Compiled ${posts.length} Markdown articles.`);
