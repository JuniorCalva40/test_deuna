import { DetokenizeResponseDto } from '../../dto/detokenize/detokenize-response.dto';

export abstract class DetokenizeImagePort {
  abstract execute(
    token: string,
    trackingData: { sessionId: string; trackingId: string; requestId: string },
  ): Promise<DetokenizeResponseDto>;
}