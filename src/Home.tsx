import * as stylex from '@stylexjs/stylex';
import { s } from './styles/ui';
import { dateLabel, postUrl, type PostMeta } from './types';

export function Home({ posts }: { posts: PostMeta[] }) {
  return <>
    <header {...stylex.props(s.homeHeader)}>
      <div {...stylex.props(s.homeTop)}><h1 {...stylex.props(s.homeTitle)}>Focus On Myself</h1><div {...stylex.props(s.homeLinks)}><a href="https://github.com/quicksandznzn">GitHub</a><a href="mailto:quicksandzn@gmail.com">Email</a></div></div>
      <p {...stylex.props(s.homeIntro)}>你好，我是 quicksandzn。这里记录编程、源码阅读和技术实践。</p>
    </header>
    <main id="main">
      <h2 {...stylex.props(s.visuallyHidden)}>文章</h2>
      <ul {...stylex.props(s.postList)}>
        {posts.map(post => <li key={post.slug} {...stylex.props(s.postItem)}>
          <time dateTime={post.date} {...stylex.props(s.postDate)}>{dateLabel(post.date)}</time>
          <div>
            <a href={postUrl(post)} {...stylex.props(s.postTitle)}>{post.title}</a>
            <p {...stylex.props(s.postDescription)}>{post.description}</p>
          </div>
        </li>)}
      </ul>
    </main>
  </>;
}
