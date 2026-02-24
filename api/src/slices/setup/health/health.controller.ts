// @scope:api
// @slice:setup/health
// @layer:presentation
// @type:controller

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FlatResponse } from '../response';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @FlatResponse()
  @ApiOperation({ operationId: 'checkHealth', summary: 'Health check' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
