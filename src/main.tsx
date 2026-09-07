import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import type { PageData, Post } from './types';
import '@fontsource/geist/latin-400.css';
import '@fontsource/geist/latin-500.css';
import '@fontsource/geist/latin-600.css';
import './styles/base.css';

const root = document.getElementById('root')!;
const embedded = JSON.parse(document.getElementById('page-data')!.textContent || 'null') as PageData | null;
if (embedded) hydrateRoot(root, <App {...embedded} />);
else if (import.meta.env.DEV) {
  const allPosts = (await import('../.cache/posts.json')).default as Post[];
  const path = location.pathname.endsWith('/') ? location.pathname : `${location.pathname}/`;
  const posts = allPosts.map(({ html, headings, text, ...meta }) => meta);
  const post = allPosts.find(post => path === `/writing/${post.slug}/`);
  createRoot(root).render(<App path={path} posts={posts} post={post} />);
}
