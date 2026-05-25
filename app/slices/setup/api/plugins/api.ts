import { client } from '../data/repositories/api/client.gen';

export default defineNuxtPlugin(() => {
  const { apiUrl } = useRuntimeConfig().public;

  client.setConfig({
    baseURL: apiUrl as string,
  });

  client.instance.interceptors.response.use(
    (response) => response,
    (error) => {
      handleError(error);
      return Promise.reject(error);
    },
  );
});
