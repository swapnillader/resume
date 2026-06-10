import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://swapnillader.github.io',
  base: '/resume',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
