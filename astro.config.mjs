import { defineConfig } from 'astro/config';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  site: 'https://chriseldred.co.uk',
  vite: {
    plugins: [yaml()],
  },
});
