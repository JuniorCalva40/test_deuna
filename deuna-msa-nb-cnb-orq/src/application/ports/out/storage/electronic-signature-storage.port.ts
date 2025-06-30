import { ElectronicSignatureRequestDto } from '../../../dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureUpdateDto } from '../../../dto/electronic-signature/electronic-signature-update.dto';
import { ELECTRONIC_SIGNATURE_STORAGE_PORT } from '../../../../domain/constants/injection.constants';

export { ELECTRONIC_SIGNATURE_STORAGE_PORT };

export interface ElectronicSignatureStoragePort {
  /**
   * Save the data of an electronic signature request in Redis
   * @param identificationNumber identification number of the applicant
   * @param data data of the request
   */
  saveSignatureRequest(
    identificationNumber: string,
    data: ElectronicSignatureRequestDto,
  ): Promise<void>;

  /**
   * Get the data of an electronic signature request from Redis
   * @param identificationNumber identification number of the applicant
   */
  getSignatureRequest(
    identificationNumber: string,
  ): Promise<ElectronicSignatureRequestDto>;

  /**
   * Update the data of an electronic signature request in Redis
   * @param identificationNumber identification number of the applicant
   * @param data updated data for the request
   */
  updateSignatureRequest(
    identificationNumber: string,
    data: ElectronicSignatureUpdateDto,
  ): Promise<void>;
}
