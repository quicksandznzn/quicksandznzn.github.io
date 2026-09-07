export interface Heading { id: string; text: string; depth: number }
export interface PostMeta { slug: string; title: string; description: string; date: string; categories: string[]; tags: string[]; minutes: number }
export interface Post extends PostMeta { html: string; headings: Heading[]; text: string }
export interface PageData { path: string; posts: PostMeta[]; post?: Post }
export const postUrl = (post: PostMeta) => `/writing/${post.slug}/`;
export const dateLabel = (date: string) => date.replaceAll('-', '.');
