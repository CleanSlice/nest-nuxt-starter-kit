import { fileURLToPath } from 'url';
import { dirname } from 'path';
import tailwindcss from '@tailwindcss/vite';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  modules: ['shadcn-nuxt'],
  css: ['#theme/assets/css/tailwind.css'],
  alias: {
    '#theme': currentDir,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  shadcn: {
    prefix: '',
    componentDir: './slices/setup/theme/components/ui',
  },
  components: {
    dirs: [],
  },
});
