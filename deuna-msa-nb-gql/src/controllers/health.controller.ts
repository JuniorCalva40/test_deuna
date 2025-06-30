import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'service' })
export class HealthController {
  @Get('health')
  getHealth() {
    return { status: 'OK', message: 'Service is healthy' };
  }
}
