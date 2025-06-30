import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { IMsaNbCnbAccountValidationService } from '../interfaces/msa-nb-cnb-account-validation-service.interface';
import {
  CnbAccountValidationRequest,
  CnbAccountValidationResponse,
} from '../interfaces/msa-nb-cnb-account-validation-service.interface';

@Injectable()
export class RestMsaNbCnbAccountValidationService
  implements IMsaNbCnbAccountValidationService
{
  private readonly logger = new Logger(RestMsaNbCnbAccountValidationService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'MSA_NB_CNB_ACCOUNT_VALIDATION_BASE_URL',
      'http://localhost:3001',
    );
  }

  async validateAccount(
    request: CnbAccountValidationRequest,
  ): Promise<CnbAccountValidationResponse> {
    try {
      this.logger.log(
        `Validating CNB account: ${request.accountNumber}`,
      );

      const response = await firstValueFrom(
        this.httpService.get<CnbAccountValidationResponse>(
          `${this.baseUrl}/api/v1/cnb/account/validate`,
          {
            params: {
              accountNumber: request.accountNumber,
            },
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(
        `CNB account validation successful for: ${request.accountNumber}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error validating CNB account ${request.accountNumber}:`,
        error.message,
      );

      if (error.response?.status === 404) {
        throw {
          status: 'error',
          error: {
            code: 'CNB_ACCOUNT_NOT_FOUND',
            message: 'CNB account not found or inactive',
            details: {
              accountNumber: request.accountNumber,
            },
          },
        };
      }

      throw {
        status: 'error',
        error: {
          code: 'CNB_ACCOUNT_VALIDATION_ERROR',
          message: 'Error validating CNB account',
          details: error.message,
        },
      };
    }
  }
} 