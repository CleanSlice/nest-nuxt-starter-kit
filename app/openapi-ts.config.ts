import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../api/swagger-spec.json',
  output: {
    format: 'prettier',
    path: './slices/setup/api/data/repositories/api',
  },
  client: '@hey-api/client-axios',
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
  ],
});
