import { readFile } from 'node:fs/promises';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin';

export default defineConfig({
  publicDir: 'static',
  plugins: [{
    name: 'article-search-index',
    configureServer(server) {
      server.middlewares.use('/search-index.json', async (_req, res) => {
        try {
          const posts = JSON.parse(await readFile('.cache/posts.json', 'utf8'));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(posts));
        } catch { res.statusCode = 500; res.end('Search index unavailable'); }
      });
    },
  }, stylex.vite({ useCSSLayers: true, unstable_moduleResolution: { type: 'commonJS', rootDir: process.cwd() } }), react()],
  build: { target: 'es2022' },
});
