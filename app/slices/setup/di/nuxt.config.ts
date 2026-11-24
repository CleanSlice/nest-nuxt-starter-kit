import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { Nitro } from 'nitropack';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  alias: {
    '#di': currentDir,
  },
  hooks: {
    'nitro:build:before': (nitro: Nitro) => {
      nitro.options.moduleSideEffects.push('reflect-metadata');
    },
  },
  vite: {
    // Vite 8 transforms TypeScript with Oxc; `legacy` is TypeScript's experimentalDecorators
    oxc: {
      decorator: {
        legacy: true,
      },
    },
  },
});
