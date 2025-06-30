import { Inject, Injectable } from '@nestjs/common';
import { KycResponseDto } from '../dto/kyc-response.dto';
import { KycBiometricValidationServicePort } from '../ports/in/services/kyc-biometric.service.port';
import {
  KycStoragePort,
  KYC_STORAGE_PORT,
} from '../ports/out/storage/kyc-storage.port';
import {
  KycQueuePort,
  KYC_QUEUE_PORT,
} from '../ports/out/queue/kyc-queue.port';
import { v4 as uuidv4 } from 'uuid';
import { FacialValidationDto } from '../dto/facial-validation.dto';
import { LivenessValidationDto } from '../dto/liveness-validation.dto';
import { SaveKycValidationUseCase } from '../use-cases/save-kyc-validation.use-case';
import { PublishKycValidationQueueUseCase } from '../use-cases/publish-kyc-validation-queue.use-case';
import { TrackingInfoDto } from '../../infrastructure/constants/common';
import { validateTrackingHeadersApi } from '../../domain/utils/validator-tracking-headers-api';
import { Logger } from '@deuna/tl-logger-nd';
import { validateKycData } from '../../domain/utils/kyc-validator';

@Injectable()
export class KycBiometricValidationService
  implements KycBiometricValidationServicePort
{
  private readonly saveKycValidationUseCase: SaveKycValidationUseCase;
  private readonly publishKycValidationQueueUseCase: PublishKycValidationQueueUseCase;

  constructor(
    @Inject(KYC_STORAGE_PORT)
    private readonly storagePort: KycStoragePort,
    @Inject(KYC_QUEUE_PORT)
    private readonly queuePort: KycQueuePort,
    private readonly logger: Logger,
  ) {
    this.saveKycValidationUseCase = new SaveKycValidationUseCase(
      this.storagePort,
    );
    this.publishKycValidationQueueUseCase =
      new PublishKycValidationQueueUseCase(this.queuePort, this.logger);
  }

  async startBiometricValidation(
    facialValidation: FacialValidationDto,
    livenessValidation: LivenessValidationDto,
    onboardingSessionId: string,
    sessionId: string,
    trackingId: string,
  ): Promise<KycResponseDto> {
    const requestId = uuidv4();
    try {
      // Validar datos de entrada usando el validador del dominio
      validateKycData(
        facialValidation,
        livenessValidation,
        onboardingSessionId,
        sessionId,
        trackingId,
      );

      const finalScanId = uuidv4();
      const trackingInfo: TrackingInfoDto = {
        sessionId,
        trackingId,
        requestId,
      };

      validateTrackingHeadersApi(
        this.logger,
        'Starting KYC Orchestrator Request',
        sessionId,
        trackingId,
        requestId,
      );

      await this.saveKycValidationUseCase.execute(finalScanId, {
        facialValidation,
        livenessValidation,
        trackingInfo,
        onboardingSessionId,
      });

      trackingInfo.requestId = uuidv4();
      // Publish validation requests for asynchronous processing using the use case
      await this.publishKycValidationQueueUseCase.execute(
        finalScanId,
        trackingInfo,
      );

      return { scanId: finalScanId };
    } catch (error) {
      throw new Error(`Error al iniciar la validación KYC: ${error.message}`);
    }
  }
}
