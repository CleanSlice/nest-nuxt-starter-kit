// @scope:api
// @slice:setup/response
// @layer:decorators
// @type:decorator

import { SetMetadata } from '@nestjs/common';

export const FLAT_RESPONSE_KEY = 'flat_response';

export const FlatResponse = () => SetMetadata(FLAT_RESPONSE_KEY, true);
