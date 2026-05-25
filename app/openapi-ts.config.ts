import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../api/swagger-spec.json',
  output: {
    path: './slices/setup/api/data/repositories/api',
  },
  postProcess: ['prettier'],
  plugins: ['@hey-api/typescript', '@hey-api/sdk', '@hey-api/client-axios'],
});
