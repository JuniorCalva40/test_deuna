import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import {
  DigitalSignatureRepositoryPort,
  DIGITAL_SIGNATURE_REPOSITORY_PORT,
} from '../../ports/out/repository/digital-signature-repository.port';
import { ElectronicSignatureRequestDto } from '../../dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureProcessResponseDto } from '../../dto/electronic-signature/electronic-signature-process-response.dto';

/**
 * Caso de uso para procesar solicitudes de firma digital
 * Responsabilidad única: Enviar datos de firma electrónica al servicio de firma digital
 */
@Injectable()
export class ProcessDigitalSignatureUseCase {
  private readonly logger = new Logger({
    context: ProcessDigitalSignatureUseCase.name,
  });

  constructor(
    @Inject(DIGITAL_SIGNATURE_REPOSITORY_PORT)
    private readonly repositoryPort: DigitalSignatureRepositoryPort,
  ) {}

  /**
   * Process a digital signature request
   * @param data data of the electronic signature request
   * @param sessionId session identifier
   * @param trackingId tracking identifier
   * @param requestId request identifier
   * @returns the result of the processing
   */
  async execute(
    data: ElectronicSignatureRequestDto,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<ElectronicSignatureProcessResponseDto> {
    this.logger.log({
      message: 'Processing digital signature request',
      identificationNumber: data.identificationNumber,
      sessionId,
      trackingId,
      requestId,
    });

    try {
      // Send the data to the external service through the repository
      const result = await this.repositoryPort.processDigitalSignature(
        data,
        sessionId,
        trackingId,
        requestId,
      );

      return result;
    } catch (error) {
      throw error;
    }
  }
}
