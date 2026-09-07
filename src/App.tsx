import * as stylex from '@stylexjs/stylex';
import { s } from './styles/ui';
import { Home } from './Home';
import { Article } from './Article';
import type { PageData } from './types';

export function App({ path, posts, post }: PageData) {
  return <div {...stylex.props(s.wrap)}>
    <a {...stylex.props(s.skip)} href="#main">跳到内容</a>
    {path === '/' ? <Home posts={posts} /> : post ? <Article post={post} /> : <main id="main" {...stylex.props(s.empty)}><h1>页面未找到</h1><p><a href="/">返回首页</a></p></main>}
  </div>;
}
