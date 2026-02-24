// @scope:api
// @slice:setup/response
// @layer:domain
// @type:types

export interface IApiResponse<T = unknown> {
  data: T;
  success: boolean;
}

export interface IMetaResponse {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface IPaginatedResponse<T = unknown> {
  data: T[];
  meta: IMetaResponse;
  success: boolean;
}
