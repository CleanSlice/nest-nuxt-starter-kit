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
  modules: ['@nuxtjs/color-mode'],
  colorMode: {
    classSuffix: '',
    preference: componentsJson.style === 'dark' ? 'dark' : 'system',
    fallback: componentsJson.style === 'dark' ? 'dark' : 'system',
  },
  vite: {
    define: {
      'process.env': process.env,
    },
  },
  devServer: {
    port: Number(process.env.PORT) || 3000,
  },
  compatibilityDate: '2024-10-04',
});
