export function useError(key: string) {
  const errorStore = useErrorStore();

  const error = computed(() => errorStore.getError(key));
  const hasError = computed(() => errorStore.errors.has(key));

  function setError(message: string) {
    errorStore.setError(key, message);
  }

  function clearError() {
    errorStore.clearError(key);
  }

  return {
    error,
    hasError,
    setError,
    clearError,
  };
}
