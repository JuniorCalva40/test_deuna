import { Injectable, Inject } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ValidateBalanceResponseDto } from '../dto/validate-balance-response.dto';
import { ValidateBalanceServiceInput } from '../dto/validate-balance-input.dto';
import { IMsaCoTransferOrchestrationService } from '../../../external-services/msa-co-transfer-orchestration/interfaces/msa-co-transfer-orchestration-service.interface';
import { MSA_CO_TRANSFER_ORCHESTRATION_SERVICE } from '../../../external-services/msa-co-transfer-orchestration/providers/msa-co-transfer-orchestration-provider';
import { IMsaMcBoClientService } from '../../../external-services/msa-mc-bo-client/interfaces/msa-mc-bo-client.interface';
import { MSA_MC_BO_CLIENT_SERVICE } from '../../../external-services/msa-mc-bo-client/providers/msa-mc-bo-client.provider';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { balanceRestrictions } from '../constant/constant';

@Injectable()
export class ValidateBalanceService {
  constructor(
    @Inject(MSA_CO_TRANSFER_ORCHESTRATION_SERVICE)
    private readonly msaCoTransferOrchestrationService: IMsaCoTransferOrchestrationService,
    @Inject(MSA_MC_BO_CLIENT_SERVICE)
    private readonly msaBoMcClientService: IMsaMcBoClientService,
  ) {}

  async validateBalance(
    input: ValidateBalanceServiceInput,
  ): Promise<ValidateBalanceResponseDto> {
    try {
      const clientData = await lastValueFrom(
        this.msaBoMcClientService.getClientData({
          identification: input.identification,
        }),
      );

      if (!clientData) {
        return ErrorHandler.handleError(
          `Error at getClientData for identification: ${input.identification}`,
          'validate-balance',
        );
      }

      const balanceResponse = await lastValueFrom(
        this.msaCoTransferOrchestrationService.validateBalance({
          accountId: clientData.clientAcountId,
        }),
      );

      if (!balanceResponse) {
        return ErrorHandler.handleError(
          `Error at validateBalance for accountId: ${clientData.clientAcountId}`,
          'validate-balance',
        );
      }

      const response: ValidateBalanceResponseDto = {
        isValidAmmount:
          balanceResponse.availableBalance >= input.ammount &&
          input.ammount <= balanceRestrictions.Maximum &&
          input.ammount >= balanceRestrictions.Minimun,
        availableBalance: balanceResponse.availableBalance,
      };

      return response;
    } catch (error) {
      return ErrorHandler.handleError(error, 'validate-balance');
    }
  }
}
