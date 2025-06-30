import { Test, TestingModule } from '@nestjs/testing';
import { InitiateCellPhoneDepositResolver } from './initiate-cellphone-deposit.resolver';
import { InitiateCellPhoneDepositService } from './services/initiate-cellphone-deposit.service';
import { InitiateCellPhoneDepositServiceInput } from './dto/initiate-cellphone-deposit-input.dto';
import { InitiateCellPhoneDepositResponse } from './dto/initiate-cellphone-deposit-response.dto';
import { DEPOSIT_REASON } from '../../common/constants/common';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

describe('InitiateCellPhoneDepositResolver', () => {
  let resolver: InitiateCellPhoneDepositResolver;
  let service: InitiateCellPhoneDepositService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiateCellPhoneDepositResolver,
        {
          provide: InitiateCellPhoneDepositService,
          useValue: {
            initiateCellPhoneDeposit: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ValidationAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetUserPersonGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetClientGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<InitiateCellPhoneDepositResolver>(
      InitiateCellPhoneDepositResolver,
    );
    service = module.get<InitiateCellPhoneDepositService>(
      InitiateCellPhoneDepositService,
    );
  });

  describe('initiateCellPhoneDeposit', () => {
    const mockInput = {
      beneficiaryPhoneNumber: '1234567890',
      amount: '10.5',
    };

    const expectedServiceInput: InitiateCellPhoneDepositServiceInput = {
      beneficiaryPhoneNumber: '1234567890',
      ordererIdentification: '1234567890',
      deviceId: 'test-device-id',
      ipAddress: '127.0.0.1',
      sessionId: 'test-session-id',
      trackingId: 'mock-uuid',
      amount: 10.5,
      reason: DEPOSIT_REASON,
      requestId: 'mock-uuid',
    };

    const mockServiceResponse: InitiateCellPhoneDepositResponse = {
      status: 'success',
      message: 'Deposit initiated',
      beneficiaryAccountNumber: '12345',
      beneficiaryName: 'Test Beneficiary',
      ordererAccountNumber: '67890',
      ordererName: 'Test Orderer',
      transactionId: 'txn-123',
    };

    const contextMock = {
      req: {
        headers: {
          'auth-token': {
            data: { ip: '127.0.0.1' },
            deviceId: 'test-device-id',
          },
          'client-info': {
            identification: '1234567890',
          },
        },
      },
    };

    it('should call service with correct parameters and return response', async () => {
      (service.initiateCellPhoneDeposit as jest.Mock).mockResolvedValue(
        mockServiceResponse,
      );
      const result = await resolver.initiateCellPhoneDeposit(
        mockInput,
        'test-session-id',
        contextMock,
      );
      expect(service.initiateCellPhoneDeposit).toHaveBeenCalledWith(
        expectedServiceInput,
      );
      expect(result).toEqual(mockServiceResponse);
    });

    it('should throw error when service fails', async () => {
      const error = new Error('Service Error');
      (service.initiateCellPhoneDeposit as jest.Mock).mockRejectedValue(error);
      await expect(
        resolver.initiateCellPhoneDeposit(
          mockInput,
          'test-session-id',
          contextMock,
        ),
      ).rejects.toThrow(error);
    });

    it('should handle missing auth-token ip', async () => {
      const contextWithoutIp = {
        req: {
          headers: {
            'auth-token': {
              data: {},
              deviceId: 'test-device-id',
            },
            'client-info': {
              identification: '1234567890',
            },
          },
        },
      };
      (service.initiateCellPhoneDeposit as jest.Mock).mockResolvedValue(
        mockServiceResponse,
      );
      await resolver.initiateCellPhoneDeposit(
        mockInput,
        'test-session-id',
        contextWithoutIp,
      );
      expect(service.initiateCellPhoneDeposit).toHaveBeenCalledWith({
        ...expectedServiceInput,
        ipAddress: '0.0.0.0',
      });
    });
  });
});
