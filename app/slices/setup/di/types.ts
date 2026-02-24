export const TYPES = {
  // Core Infrastructure
  ApiClient: Symbol.for('ApiClient'),
  Logger: Symbol.for('Logger'),
  Config: Symbol.for('Config'),

  // User Slice
  UserGateway: Symbol.for('IUserGateway'),
  UserService: Symbol.for('UserService'),
} as const;

export type TYPES = typeof TYPES;
