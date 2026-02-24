import { client } from '../data/repositories/api/sdk.gen';
import { apiConfig } from '../api.config';

export default defineNuxtPlugin(() => {
  client.setConfig({
    baseURL: apiConfig.baseURL,
  });

  client.instance.interceptors.response.use(
    (response) => response,
    (error) => {
      handleError(error);
      return Promise.reject(error);
    },
  );
});
