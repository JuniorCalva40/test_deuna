import { Injectable, Logger, Inject } from '@nestjs/common';
import { IMsaNbAliasManagementService } from '../../../external-services/msa-nb-alias-management/interfaces/msa-nb-alias-management-service.interface';
import { CreateDynamicQrResponseDto } from '../../../external-services/msa-nb-alias-management/dto/create-dynamic-qr-response.dto';
import { GetDynamicQrResponseDto } from '../../../external-services/msa-nb-alias-management/dto/get-dynamic-qr-response.dto';
import { MSA_NB_ALIAS_MANAGEMENT_SERVICE } from '../../../external-services/msa-nb-alias-management/providers/msa-nb-alias-management.provider';
import { IMsaNbCnbAccountValidationService } from '../../../external-services/msa-nb-cnb-account-validation/interfaces/msa-nb-cnb-account-validation-service.interface';
import { MSA_NB_CNB_ACCOUNT_VALIDATION_SERVICE } from '../../../external-services/msa-nb-cnb-account-validation/providers/msa-nb-cnb-account-validation-service.provider';
import { ErrorCodes } from '../../../common/constants/error-codes';

@Injectable()
export class GenerateQrService {
  private readonly logger = new Logger(GenerateQrService.name);

  constructor(
    @Inject(MSA_NB_ALIAS_MANAGEMENT_SERVICE)
    private readonly aliasManagementService: IMsaNbAliasManagementService,
    @Inject(MSA_NB_CNB_ACCOUNT_VALIDATION_SERVICE)
    private readonly cnbAccountValidationService: IMsaNbCnbAccountValidationService,
  ) {}

  async generateQr(
    deviceId,
    amount,
    identification,
    businessName,
    accountNumber,
    merchantId,
  ): Promise<CreateDynamicQrResponseDto> {
    try {
      // Validar cuenta CNB antes de generar el QR
      this.logger.log(`Validating CNB account before generating QR: ${accountNumber}`);
      
      const accountValidation = await this.cnbAccountValidationService.validateAccount({
        accountNumber,
      });

      if (!accountValidation.data.isActive) {
        this.logger.error(`CNB account is not active: ${accountNumber}`);
        throw {
          code: ErrorCodes.CONTRACT_TYPE_INVALID,
          message: 'CNB account is not active or blocked',
          details: {
            accountNumber,
            accountStatus: accountValidation.data.accountStatus,
          },
        };
      }

      this.logger.log(`CNB account validation successful for: ${accountNumber}`);

      const qrResponse = await this.aliasManagementService
        .generateDynamicQr({
          deviceId,
          amount,
          identification,
          businessName,
          accountNumber,
          merchantId,
        })
        .toPromise();
      this.logger.log('Dynamic QR code generated successfully');
      return qrResponse;
    } catch (error) {
      this.logger.error(`Failed to generate dynamic QR code: ${error.message}`);
      throw error;
    }
  }

  async getQr(transactionId: string): Promise<GetDynamicQrResponseDto> {
    try {
      const qrResponse = await this.aliasManagementService
        .getDynamicQr(transactionId)
        .toPromise();
      this.logger.log('QR information retrieved successfully');
      return qrResponse;
    } catch (error) {
      this.logger.error(`Failed to retrieve QR information: ${error.message}`);
      throw error;
    }
  }
}
