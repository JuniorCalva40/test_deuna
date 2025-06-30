import { ElectronicSignatureRequestDto } from '../../../dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureResponseDto } from '../../../dto/electronic-signature/electronic-signature-redis-response.dto';
import { ElectronicSignatureUpdateDto } from '../../../dto/electronic-signature/electronic-signature-update.dto';
import { ElectronicSignatureUpdateResponseDto } from '../../../dto/electronic-signature/electronic-signature-update-redis-response.dto';
import { ElectronicSignatureGetResponseDto } from '../../../dto/electronic-signature/electronic-signature-get-response.dto';
import { ElectronicSignatureProcessResponseDto } from '../../../dto/electronic-signature/electronic-signature-process-response.dto';
import { ELECTRONIC_SIGNATURE_PORT } from '../../../../domain/constants/injection.constants';

export { ELECTRONIC_SIGNATURE_PORT };

export interface ElectronicSignatureServicePort {
  /**
   * Save a signature request in Redis
   * @param request signature request data
   * @param sessionId session identifier
   * @param trackingId tracking identifier
   * @param requestId request identifier
   */
  saveSignatureRequest(
    request: ElectronicSignatureRequestDto,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<ElectronicSignatureResponseDto>;

  /**
   * Update a signature request in Redis
   * @param identificationNumber identification number of the applicant
   * @param updateData updated data for the signature request
   * @param sessionId session identifier
   * @param trackingId tracking identifier
   * @param requestId request identifier
   */
  updateSignatureRequest(
    identificationNumber: string,
    updateData: ElectronicSignatureUpdateDto,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<ElectronicSignatureUpdateResponseDto>;

  /**
   * Get a signature request from Redis
   * @param identificationNumber identification number of the applicant
   * @param sessionId session identifier
   * @param trackingId tracking identifier
   * @param requestId request identifier
   */
  getSignatureRequest(
    identificationNumber: string,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<ElectronicSignatureGetResponseDto>;

  /**
   * Procesa una solicitud de firma digital recuperando datos de Redis y enviándolos al servicio externo
   * @param identificationNumber número de identificación del solicitante
   * @param sessionId identificador de sesión
   * @param trackingId identificador de seguimiento
   * @param requestId identificador de solicitud
   */
  processDigitalSignature(
    identificationNumber: string,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<ElectronicSignatureProcessResponseDto>;
}
