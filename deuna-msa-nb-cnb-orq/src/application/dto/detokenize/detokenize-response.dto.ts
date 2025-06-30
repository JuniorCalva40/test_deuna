import { IDetokenizeResponse } from '../../../domain/interfaces/detokenize-response.interface';

/**
 * DTO for detokenize response
 */
export class DetokenizeResponseDto implements IDetokenizeResponse {
  /**
   * Base64 image data resulting from detokenization
   */
  imageData: string;

  /**
   * Status of the detokenization request
   */
  status: string;

  /**
   * Additional information if needed
   */
  message?: string;
}
