import { IsNotEmpty, IsString } from 'class-validator';
import { IDetokenizeRequest } from '../../../domain/interfaces/detokenize-request.interface';

/**
 * DTO for detokenize requests
 */
export class DetokenizeRequestDto implements IDetokenizeRequest {
  /**
   * Token to be detokenized
   */
  @IsString()
  @IsNotEmpty()
  bestImageToken: string;
}
