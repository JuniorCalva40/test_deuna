import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  CreateCalificationInput,
  CreateCalificationResponse,
} from '../dto/create-calification.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { lastValueFrom } from 'rxjs';
import {
  IMsaCoCalificationService,
  MSA_CO_CALIFICATION_SERVICE,
} from '../../../external-services/msa-co-calification/interfaces/msa-co-calification-service.interface';

@Injectable()
export class CreateCalificationService {
  private readonly logger = new Logger(CreateCalificationService.name);
  private readonly CONTEXT = 'create-calification';

  constructor(
    @Inject(MSA_CO_CALIFICATION_SERVICE)
    private readonly calificationService: IMsaCoCalificationService,
  ) {}
  async createCalification(
    input: CreateCalificationInput,
    username: string,
  ): Promise<CreateCalificationResponse> {
    try {
      this.validateCalificationInput(username, input.rating, input.context);
      this.logger.debug(`Processing calification for user ${username}`);

      const response = await lastValueFrom(
        this.calificationService.sendCalification({
          userId: username,
          rating: input.rating,
          context: input.context,
          comments: input.comments ?? '',
        }),
      );

      if (!response) {
        this.logger.error('No response received from calification service');
        throw {
          code: ErrorCodes.CALIFICATION_PROCESS_FAILED,
          message: 'Failed to process calification: No response received',
        };
      }

      if (response.status !== 'success') {
        this.logger.error(`Calification service error: ${response.message}`);
        throw {
          code: ErrorCodes.CALIFICATION_SERVICE_ERROR,
          message: response.message || 'Calification service error',
          details: response,
        };
      }

      this.logger.debug('Calification processed successfully');
      return { status: 'success' };
    } catch (error) {
      this.logger.error(
        `Error in createCalification: ${error.message}`,
        error.stack,
      );
      return ErrorHandler.handleError(error, this.CONTEXT);
    }
  }

  private validateCalificationInput(
    username: string,
    rating: number,
    context: string,
  ): void {
    if (!username?.trim()) {
      throw {
        code: ErrorCodes.CALIFICATION_INVALID_USER,
        message: 'User ID is required and cannot be empty',
      };
    }

    if (
      rating === undefined ||
      (rating !== 0 && rating !== 2 && rating !== 4)
    ) {
      throw {
        code: ErrorCodes.CALIFICATION_INVALID_RATING,
        message:
          'Rating is required and cannot be empty, valid values are 0, 2 or 4',
      };
    }
    if (!context?.trim()) {
      throw {
        code: ErrorCodes.CALIFICATION_INVALID_CONTEXT,
        message: 'Context is required and cannot be empty',
      };
    }
  }
}
