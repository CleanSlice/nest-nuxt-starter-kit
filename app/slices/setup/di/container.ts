import 'reflect-metadata';
import { Container } from 'inversify';

class DIContainer {
  private static instance: Container | null = null;

  static getInstance(): Container {
    if (!DIContainer.instance) {
      DIContainer.instance = new Container({
        defaultScope: 'Singleton',
        autoBindInjectable: true,
      });
    }
    return DIContainer.instance;
  }

  static reset(): void {
    if (DIContainer.instance) {
      DIContainer.instance.unbindAll();
      DIContainer.instance = null;
    }
  }

  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  static useMocks(): boolean {
    return process.env.NUXT_PUBLIC_USE_MOCKS === 'true';
  }
}

export const container = DIContainer.getInstance();
export { DIContainer };
