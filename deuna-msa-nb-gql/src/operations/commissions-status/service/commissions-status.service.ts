import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommissionsButtonStatusResponseDto } from '../dto/commissions-status.response.dto';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';

const COMMISSIONS_BUTTON_CONTEXT = 'GET_COMMISSIONS_BUTTON_STATUS';

@Injectable()
export class CommissionsStatusService {
  constructor(private readonly configService: ConfigService) {}

  getCommissionsButtonStatus(): CommissionsButtonStatusResponseDto {
    const today = new Date();
    const currentDay = today.getDate();

    const maxCommissionDays = process.env.MAX_COMMISSION_DAYS;
    const parsedMaxDays = Number(maxCommissionDays);

    if (!Number.isFinite(parsedMaxDays) || parsedMaxDays <= 0) {
      ErrorHandler.handleError(
        {
          message: 'Missing or invalid MAX_COMMISSION_DAYS',
          code: ErrorCodes.SYS_CONFIG_INVALID,
          details: { envVar: 'MAX_COMMISSION_DAYS', received: maxCommissionDays },
        },
        COMMISSIONS_BUTTON_CONTEXT,
      );
    }

    const isWithinRange = currentDay >= 1 && currentDay <= parsedMaxDays;

    if (isWithinRange) {
      return {
        status: 'OK',
        message: 'El botón de comisiones está habilitado',
      };
    }

    return {
      status: 'ERROR',
      message: `Se habilitará el cobro los ${parsedMaxDays} primeros días del mes.`,
    };
  }
}