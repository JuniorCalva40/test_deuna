import { Injectable, Inject } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { DetokenizeClientPort } from '../../ports/out/clients/detokenize-client.port';
import { DetokenizeRequestDto } from '../../dto/detokenize/detokenize-request.dto';
import { DetokenizeResponseDto } from '../../dto/detokenize/detokenize-response.dto';
import { DETOKENIZE_CLIENT_PORT } from '../../../domain/constants/injection.constants';
import { DetokenizeImagePort } from '../../ports/in/detokenize-image.port';

/**
 * Use case for detokenizing images
 */
@Injectable()
export class DetokenizeImageUseCase implements DetokenizeImagePort {
  private readonly logger = new Logger({
    context: DetokenizeImageUseCase.name,
  });

  constructor(
    @Inject(DETOKENIZE_CLIENT_PORT)
    private readonly detokenizeClient: DetokenizeClientPort,
  ) {}

  /**
   * Detokenizes an image token
   * @param token - The token to detokenize
   * @param trackingData - Tracking data for request tracing
   * @returns The detokenized image data
   */
  async execute(
    token: string,
    trackingData: { sessionId: string; trackingId: string; requestId: string },
  ): Promise<DetokenizeResponseDto> {
    try {
      this.logger.log({
        message: 'Starting image detokenization process',
        token: token.substring(0, 20) + '...',
        ...trackingData,
      });

      const request = new DetokenizeRequestDto();
      request.bestImageToken = token;

      const result = await this.detokenizeClient.detokenizeImage(
        request,
        trackingData,
      );

      this.logger.log({
        message: 'Image detokenization process completed successfully',
        status: result.status,
        ...trackingData,
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Error during image detokenization process',
        error: error.message,
        stack: error.stack,
        ...trackingData,
      });
      throw error;
    }
  }
}
