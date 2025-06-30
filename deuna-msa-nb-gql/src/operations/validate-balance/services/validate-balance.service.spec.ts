import { Test, TestingModule } from '@nestjs/testing';
import { ValidateBalanceService } from './validate-balance.service';
import { IMsaCoTransferOrchestrationService } from '../../../external-services/msa-co-transfer-orchestration/interfaces/msa-co-transfer-orchestration-service.interface';
import { MSA_CO_TRANSFER_ORCHESTRATION_SERVICE } from '../../../external-services/msa-co-transfer-orchestration/providers/msa-co-transfer-orchestration-provider';
import { IMsaMcBoClientService } from '../../../external-services/msa-mc-bo-client/interfaces/msa-mc-bo-client.interface';
import { MSA_MC_BO_CLIENT_SERVICE } from '../../../external-services/msa-mc-bo-client/providers/msa-mc-bo-client.provider';
import { ValidateBalanceServiceInput } from '../dto/validate-balance-input.dto';
import { ValidateBalanceResponseDto } from '../dto/validate-balance-response.dto';
import { ApolloError } from 'apollo-server-express';
import { of, throwError } from 'rxjs';

describe('ValidateBalanceService', () => {
  let service: ValidateBalanceService;
  let msaCoTransferOrchestrationService: IMsaCoTransferOrchestrationService;
  let msaMcBoClientService: IMsaMcBoClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateBalanceService,
        {
          provide: MSA_CO_TRANSFER_ORCHESTRATION_SERVICE,
          useValue: {
            validateBalance: jest.fn(),
          },
        },
        {
          provide: MSA_MC_BO_CLIENT_SERVICE,
          useValue: {
            getClientData: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ValidateBalanceService>(ValidateBalanceService);
    msaCoTransferOrchestrationService =
      module.get<IMsaCoTransferOrchestrationService>(
        MSA_CO_TRANSFER_ORCHESTRATION_SERVICE,
      );
    msaMcBoClientService = module.get<IMsaMcBoClientService>(
      MSA_MC_BO_CLIENT_SERVICE,
    );
  });

  it('should return a valid response if balance check is successful', async () => {
    const input: ValidateBalanceServiceInput = {
      identification: '12345',
      ammount: 100,
    };

    const clientDataMock = { clientAcountId: '12345679' };
    const balanceResponseMock = {
      totalBalance: 120,
      overdraftAmount: 0,
      technicalOverdraftAmount: 0,
      lockedBalance: 0,
      holdBalance: 0,
      availableBalance: 120,
      overdraftInterestDue: 0,
      technicalOverdraftInterestDue: 0,
      feesDue: 0,
      blockedBalance: 0,
      forwardAvailableBalance: 0,
    };

    jest
      .spyOn(msaMcBoClientService, 'getClientData')
      .mockReturnValue(of({ id: '12345679', ...clientDataMock }));
    jest
      .spyOn(msaCoTransferOrchestrationService, 'validateBalance')
      .mockReturnValue(of(balanceResponseMock));

    const result: ValidateBalanceResponseDto =
      await service.validateBalance(input);

    expect(result).toEqual({
      isValidAmmount: true,
      availableBalance: 120,
    });
  });

  it('should throw ApolloError if client data is not found', async () => {
    const input: ValidateBalanceServiceInput = {
      identification: '12345',
      ammount: 100,
    };

    jest.spyOn(msaMcBoClientService, 'getClientData').mockReturnValue(of(null));

    await expect(service.validateBalance(input)).rejects.toThrow(ApolloError);
    await expect(service.validateBalance(input)).rejects.toThrow(
      '[VALIDATE-BALANCE] Error: Error at getClientData for identification: 12345',
    );
  });

  it('should throw ApolloError if balance response is not found', async () => {
    const input: ValidateBalanceServiceInput = {
      identification: '12345',
      ammount: 100,
    };

    const clientDataMock = { clientAcountId: '12345679' };

    jest
      .spyOn(msaMcBoClientService, 'getClientData')
      .mockReturnValue(of({ id: '12345679', ...clientDataMock }));
    jest
      .spyOn(msaCoTransferOrchestrationService, 'validateBalance')
      .mockReturnValue(of(null));

    await expect(service.validateBalance(input)).rejects.toThrow(ApolloError);
    await expect(service.validateBalance(input)).rejects.toThrow(
      '[VALIDATE-BALANCE] Error: Error at validateBalance for accountId: 12345679',
    );
  });

  it('should throw ApolloError on unexpected errors', async () => {
    const input: ValidateBalanceServiceInput = {
      identification: '12345',
      ammount: 100,
    };

    const error = new Error('Unexpected error');
    jest
      .spyOn(msaMcBoClientService, 'getClientData')
      .mockReturnValue(throwError(() => error));

    await expect(service.validateBalance(input)).rejects.toThrow(ApolloError);
    await expect(service.validateBalance(input)).rejects.toThrow(
      'Unexpected error',
    );
  });

  it('should return a invalid response if balance is lower than minimun', async () => {
    const input: ValidateBalanceServiceInput = {
      identification: '12345',
      ammount: 0.5,
    };

    const clientDataMock = { clientAcountId: '12345679' };
    const balanceResponseMock = {
      totalBalance: 5000,
      overdraftAmount: 0,
      technicalOverdraftAmount: 0,
      lockedBalance: 0,
      holdBalance: 0,
      availableBalance: 5000,
      overdraftInterestDue: 0,
      technicalOverdraftInterestDue: 0,
      feesDue: 0,
      blockedBalance: 0,
      forwardAvailableBalance: 0,
    };

    jest
      .spyOn(msaMcBoClientService, 'getClientData')
      .mockReturnValue(of({ id: '12345679', ...clientDataMock }));
    jest
      .spyOn(msaCoTransferOrchestrationService, 'validateBalance')
      .mockReturnValue(of(balanceResponseMock));

    const result: ValidateBalanceResponseDto =
      await service.validateBalance(input);

    expect(result).toEqual({
      isValidAmmount: false,
      availableBalance: 5000,
    });
  });

  it('should return a invalid response if balance is higher than maximum', async () => {
    const input: ValidateBalanceServiceInput = {
      identification: '12345',
      ammount: 1500,
    };

    const clientDataMock = { clientAcountId: '12345679' };
    const balanceResponseMock = {
      totalBalance: 5000,
      overdraftAmount: 0,
      technicalOverdraftAmount: 0,
      lockedBalance: 0,
      holdBalance: 0,
      availableBalance: 5000,
      overdraftInterestDue: 0,
      technicalOverdraftInterestDue: 0,
      feesDue: 0,
      blockedBalance: 0,
      forwardAvailableBalance: 0,
    };

    jest
      .spyOn(msaMcBoClientService, 'getClientData')
      .mockReturnValue(of({ id: '12345679', ...clientDataMock }));
    jest
      .spyOn(msaCoTransferOrchestrationService, 'validateBalance')
      .mockReturnValue(of(balanceResponseMock));

    const result: ValidateBalanceResponseDto =
      await service.validateBalance(input);

    expect(result).toEqual({
      isValidAmmount: false,
      availableBalance: 5000,
    });
  });
});
