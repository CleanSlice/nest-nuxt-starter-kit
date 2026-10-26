import { readFileSync } from 'fs';
import { resolve } from 'path';
import { registerSlices } from './registerSlices';

const componentsJson = JSON.parse(
  readFileSync(resolve(__dirname, 'components.json'), 'utf-8'),
);

export default defineNuxtConfig({
  devtools: { enabled: false },
  extends: [...registerSlices()],
  ssr: false,
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  modules: ['@nuxtjs/color-mode'],
  colorMode: {
    classSuffix: '',
    preference: componentsJson.style === 'dark' ? 'dark' : 'system',
    fallback: componentsJson.style === 'dark' ? 'dark' : 'system',
  },
  runtimeConfig: {
    public: {
      apiUrl: 'http://localhost:4229',
      useMocks: 'false',
    },
  },
  devServer: {
    port: Number(process.env.PORT) || 4226,
  },
  compatibilityDate: '2025-06-01',
});
