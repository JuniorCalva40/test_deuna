import { Logger } from '@deuna/tl-logger-nd';
import {
  Body,
  Controller,
  Post,
  Headers,
  Get,
  Param,
  Inject,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import {
  CnbStateValidationDTO,
  CnbStateValidationResponseDTO,
} from '../../../application/dto/cnb-state-validation-request.dto';
import {
  CNB_STATE_VALIDATION_PORT,
  CnbStateValidationServicePort,
} from '../../../application/ports/in/services/cnb-state-validation.service.port';
import { validateTrackingHeadersApi } from '../../../domain/utils/validator-tracking-headers-api';

@Controller('v1/cnb/cnb-state-validation')
export class CnbStateValidationController {
  constructor(
    @Inject(CNB_STATE_VALIDATION_PORT)
    private readonly CnbStateValidationService: CnbStateValidationServicePort,
    private readonly logger: Logger,
  ) {}

  @Post('/save')
  @ApiOperation({ summary: 'Guarda la validación del estado del cnb' })
  @ApiResponse({ type: CnbStateValidationResponseDTO })
  @ApiHeader({ name: 'sessionId', required: true })
  @ApiHeader({ name: 'trackingId', required: true })
  @ApiHeader({ name: 'requestId', required: true })
  async saveValidation(
    @Body() request: CnbStateValidationDTO,
    @Headers('sessionId') sessionId: string,
    @Headers('trackingId') trackingId: string,
    @Headers('requestId') requestId: string,
  ): Promise<CnbStateValidationResponseDTO> {
    validateTrackingHeadersApi(
      this.logger,
      'Saving CNB State Validation',
      sessionId,
      trackingId,
      requestId,
    );

    return await this.CnbStateValidationService.saveValidation(
      request.identification,
      request,
    );
  }

  @Get(':identification')
  @ApiOperation({ summary: 'Obtiene la validación del estado del cnb' })
  @ApiResponse({ status: 200, type: CnbStateValidationDTO })
  @ApiResponse({ status: 200, type: CnbStateValidationResponseDTO })
  @ApiHeader({ name: 'sessionId', required: true })
  @ApiHeader({ name: 'trackingId', required: true })
  @ApiHeader({ name: 'requestId', required: true })
  async getValidation(
    @Param('identification') identification: string,
    @Headers('sessionId') sessionId: string,
    @Headers('trackingId') trackingId: string,
    @Headers('requestId') requestId: string,
  ): Promise<CnbStateValidationDTO | CnbStateValidationResponseDTO> {
    validateTrackingHeadersApi(
      this.logger,
      'Retrieving CNB State Validation',
      sessionId,
      trackingId,
      requestId,
    );

    const response =
      await this.CnbStateValidationService.getValidation(identification);
    return response;
  }
}
