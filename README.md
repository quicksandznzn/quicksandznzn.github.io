# Focus On Myself

个人技术博客。React + TypeScript + StyleX + Vite，页面与组件自定义，不依赖博客主题。

## 本地开发

需要 Node.js 22.12 或更新版本。

```sh
npm ci
npm run dev
```

打开终端显示的地址。组件修改支持热更新；修改 Markdown 后重新运行 `npm run dev`，重新生成文章数据。

```sh
npm test         # 类型检查、生产构建与内容/路由检查
npm run preview  # 预览 dist 中的静态站点
```

## 写文章

在 `content/posts/` 中新增 Markdown，格式如下：

```yaml
---
title: "文章标题"
date: "2026-09-07"
description: "一句话摘要"
categories: ["Java"]
tags: ["源码"]
---
```

文件名生成 `/writing/文件名/`，下划线会转成连字符。文件名须唯一。`draft: true` 和未来日期的文章不会发布。图片放在 `static/image/`，在正文中使用 `/image/文件名`。

构建生成文章 HTML、代码高亮和站点地图。生产页面预渲染，正文无需等待 JavaScript 加载。没有旧 Hugo 地址的重定向或兼容层。

## 调整设计

- `src/styles/tokens.stylex.ts`：StyleX 颜色变量。
- `src/styles/ui.ts`：组件布局、排版、响应式样式。
- `src/styles/base.css`：文档 reset、深色变量和 Markdown 正文。
- `src/Home.tsx`：首页简介与文章列表。
- `src/App.tsx`：页面选择。

## 构建与发布

`npm run build` 使用 Vite 构建客户端和静态渲染入口，再由 `scripts/prerender.mjs` 生成独立 HTML，输出到 `dist/`。代码不使用第三方页面模板，也不需要运行服务器。

GitHub Pages 设置中选择 **GitHub Actions**，然后手动运行 **Publish blog** 工作流即可发布。本地预览不会发布到线上。

站点域名在 `scripts/prerender.mjs` 中配置。更换域名时同步修改它，canonical 和 sitemap 会使用该地址。
