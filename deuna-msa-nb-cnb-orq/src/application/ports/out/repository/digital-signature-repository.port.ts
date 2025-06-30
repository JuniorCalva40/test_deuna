import { ElectronicSignatureRequestDto } from '../../../dto/electronic-signature/electronic-signature-redis-request.dto';
import { DIGITAL_SIGNATURE_REPOSITORY_PORT } from '../../../../domain/constants/injection.constants';
import { ElectronicSignatureProcessResponseDto } from '../../../dto/electronic-signature/electronic-signature-process-response.dto';

export { DIGITAL_SIGNATURE_REPOSITORY_PORT };

export interface DigitalSignatureRepositoryPort {
  /**
   * Process a digital signature request by sending it to the external service
   * @param data data of the electronic signature request
   * @param sessionId session identifier
   * @param trackingId tracking identifier
   * @param requestId request identifier
   */
  processDigitalSignature(
    data: ElectronicSignatureRequestDto,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<ElectronicSignatureProcessResponseDto>;
}
