import { Controller, Inject, Post, Body, Headers } from '@nestjs/common';
import { KycResponseDto } from '../../../application/dto/kyc-response.dto';
import {
  KycBiometricValidationServicePort,
  KYC_PORT,
} from '../../../application/ports/in/services/kyc-biometric.service.port';
import { KycBiometricRequestDto } from '../../../application/dto/kyc-biometric-request.dto';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { validateTrackingHeadersApi } from '../../../domain/utils/validator-tracking-headers-api';
import { Logger } from '@deuna/tl-logger-nd';

@Controller('v1/cnb')
export class KycController {
  constructor(
    @Inject(KYC_PORT)
    private readonly kycBiometricValidationService: KycBiometricValidationServicePort,
    private readonly logger: Logger,
  ) {}

  @Post('kyc')
  @ApiOperation({ summary: 'Inicia la validación KYC' })
  @ApiResponse({ type: KycResponseDto })
  @ApiHeader({ name: 'sessionId', required: true })
  @ApiHeader({ name: 'trackingId', required: true })
  @ApiHeader({ name: 'requestId', required: true })
  async submitKyc(
    @Body() request: KycBiometricRequestDto,
    @Headers('sessionId') sessionId: string,
    @Headers('trackingId') trackingId: string,
    @Headers('requestId') requestId: string,
  ): Promise<KycResponseDto> {
    validateTrackingHeadersApi(
      this.logger,
      'Starting KYC Orchestrator Request -Controller',
      sessionId,
      trackingId,
      requestId,
    );
    const { facialValidation, livenessValidation, onboardingSessionId } =
      request;

    return await this.kycBiometricValidationService.startBiometricValidation(
      facialValidation,
      livenessValidation,
      onboardingSessionId,
      sessionId,
      trackingId,
    );
  }
}
