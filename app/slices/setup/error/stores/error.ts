export const useErrorStore = defineStore('error', () => {
  const errors = ref<Map<string, string>>(new Map());

  function setError(key: string, message: string) {
    errors.value.set(key, message);
  }

  function clearError(key: string) {
    errors.value.delete(key);
  }

  function clearAll() {
    errors.value.clear();
  }

  function getError(key: string): string | undefined {
    return errors.value.get(key);
  }

  return {
    errors,
    setError,
    clearError,
    clearAll,
    getError,
  };
});
