import { Controller, Get, Injectable, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthServicePort } from '../../../application/ports/in/services/health.service.port';
import { HEALTH_SERVICE_PORT } from '../../../application/ports/in/services/health.service.port';

@ApiTags('service')
@Controller({
  path: 'service',
})
@Injectable()
export class HealthController {
  constructor(
    @Inject(HEALTH_SERVICE_PORT)
    private readonly healthService: HealthServicePort,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({
    status: 200,
    description: 'Service health information',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        message: { type: 'string' },
        timestamp: { type: 'string' },
        version: { type: 'string' },
      },
    },
  })
  async health() {
    return await this.healthService.checkHealth();
  }
}
