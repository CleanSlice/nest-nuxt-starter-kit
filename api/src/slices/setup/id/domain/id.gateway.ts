// @scope:api
// @slice:setup/id
// @layer:domain
// @type:gateway

export abstract class IIdGateway {
  /** Reserve once before external effects. Failed operations do not recycle IDs. */
  abstract reserve(prefix: string): Promise<string>;
}
