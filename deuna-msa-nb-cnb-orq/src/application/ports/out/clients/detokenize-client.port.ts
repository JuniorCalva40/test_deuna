import { DetokenizeRequestDto } from '../../../dto/detokenize/detokenize-request.dto';
import { DetokenizeResponseDto } from '../../../dto/detokenize/detokenize-response.dto';

/**
 * Port for the detokenize client
 * Defines methods to interact with the external detokenization service
 */
export interface DetokenizeClientPort {
  /**
   * Detokenizes an image token
   * @param request - The request containing the token to detokenize
   * @param trackingData - The tracking data for the request (sessionId, trackingId, requestId)
   * @returns A promise with the detokenized image data
   */
  detokenizeImage(
    request: DetokenizeRequestDto,
    trackingData: { sessionId: string; trackingId: string; requestId: string },
  ): Promise<DetokenizeResponseDto>;
}
