import { useEffect, useRef } from 'react';
import * as stylex from '@stylexjs/stylex';
import { s } from './styles/ui';
import { ThemeToggle } from './components/ThemeToggle';
import { dateLabel, type Post } from './types';

export function Article({ post }: { post: Post }) {
  const body = useRef<HTMLElement>(null);
  useEffect(() => {
    const buttons: HTMLButtonElement[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    body.current?.querySelectorAll('pre').forEach(pre => {
      const button = document.createElement('button');
      button.className = stylex.props(s.copy).className || '';
      button.textContent = '复制'; button.setAttribute('aria-label', '复制代码');
      button.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(pre.querySelector('code')?.textContent || ''); button.textContent = '已复制'; }
        catch { button.textContent = '请手动选择复制'; }
        timers.push(setTimeout(() => { button.textContent = '复制'; }, 2000));
      });
      pre.append(button); buttons.push(button);
    });
    return () => { buttons.forEach(button => button.remove()); timers.forEach(clearTimeout); };
  }, [post]);
  return <main id="main">
    <header {...stylex.props(s.articleHeader)}><div {...stylex.props(s.articleTop)}><a {...stylex.props(s.back)} href="/">← Focus On Myself</a><ThemeToggle /></div><h1 {...stylex.props(s.articleTitle)}>{post.title}</h1><p {...stylex.props(s.articleDescription)}>{post.description}</p><div {...stylex.props(s.meta)}><time dateTime={post.date}>{dateLabel(post.date)}</time><span>{post.minutes} 分钟阅读</span></div></header>
    <article ref={body} {...stylex.props(s.articleBody)} className={`${stylex.props(s.articleBody).className} prose`} dangerouslySetInnerHTML={{ __html: post.html }} />
  </main>;
}
