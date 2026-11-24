import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../api/swagger-spec.json',
  output: {
    path: './slices/setup/api/data/repositories/api',
    postProcess: ['prettier'],
    // tsconfig.json extends .nuxt/tsconfig.json, which a fresh checkout (the Docker build) does not have yet
    tsConfigPath: null,
  },
  plugins: ['@hey-api/typescript', '@hey-api/sdk', '@hey-api/client-axios'],
});
