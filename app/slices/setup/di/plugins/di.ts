import { container } from '../container';

export function registerSetupDI(): void {
  // Register core infrastructure here: Logger, Config, ApiClient
  console.log('[DI] Setup slice registered');
}

export default defineNuxtPlugin(() => {
  registerSetupDI();

  return {
    provide: { container },
  };
});
