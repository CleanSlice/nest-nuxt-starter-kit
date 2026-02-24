import { registerSlices } from './registerSlices';

export default defineNuxtConfig({
  devtools: { enabled: false },
  extends: [...registerSlices()],
  ssr: false,
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
