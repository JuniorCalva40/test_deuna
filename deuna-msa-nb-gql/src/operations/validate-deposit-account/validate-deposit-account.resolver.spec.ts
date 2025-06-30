import { Test, TestingModule } from '@nestjs/testing';
import { ValidateDepositAccountResolver } from './validate-deposit-account.resolver';
import { ValidateDepositAccountService } from './services/validate-deposit-account.service';
import { ValidateDepositAccountResponse } from './dto/validate-deposit-account-response.dto';
import {
  ValidateDepositAccountInput,
  ValidateDepositAccountServiceInput,
} from './dto/validate-deposit-account-input.dto';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

describe('ValidateDepositAccountResolver', () => {
  let resolver: ValidateDepositAccountResolver;
  let validateDepositAccountService: jest.Mocked<ValidateDepositAccountService>;

  beforeEach(async () => {
    const mockValidateDepositAccountService = {
      validateDepositAccount: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockHttpService = {
      axiosRef: {
        get: jest.fn(),
        post: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateDepositAccountResolver,
        {
          provide: ValidateDepositAccountService,
          useValue: mockValidateDepositAccountService,
        },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    resolver = module.get<ValidateDepositAccountResolver>(
      ValidateDepositAccountResolver,
    );
    validateDepositAccountService = module.get(
      ValidateDepositAccountService,
    ) as jest.Mocked<ValidateDepositAccountService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('validateDepositAccount', () => {
    it('should call validateDepositAccountService.validateDepositAccount and return the result', async () => {
      const mockInput: ValidateDepositAccountServiceInput = {
        trackingId: 'test-session-Id',
        beneficiaryPhoneNumber: '1234567890',
      };

      const expectedResponse: ValidateDepositAccountResponse = {
        status: 'SUCCESS',
        message: 'Deposit account validated successfully',
        beneficiaryAccountNumber: '',
        beneficiaryName: '',
      };

      validateDepositAccountService.validateDepositAccount.mockResolvedValue(
        expectedResponse,
      );

      const result = await resolver.validateDepositAccount(mockInput, {
        req: {
          headers: {
            'user-person': {
              email: 'test@test.com',
              phoneNumber: '12345679',
              identification: 'test-identification',
            },
            'auth-token': {
              data: {
                ip: '0.0.0.0',
              },
              sessionId: 'test-session-Id',
              deviceId: 'test-device-id',
            },
            'client-info': {
              identification: 'test-identification',
              cifAccount: 'CIF123456',
            },
            trackingid: 'test-trackinId',
          },
        },
      });

      expect(
        validateDepositAccountService.validateDepositAccount,
      ).toHaveBeenCalledWith(mockInput);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from validateDepositAccountService.validateDepositAccount', async () => {
      const mockInput: ValidateDepositAccountInput = {
        beneficiaryPhoneNumber: '',
      };

      const expectedError = new Error(
        `Cannot read properties of undefined (reading 'sessionId')`,
      );

      validateDepositAccountService.validateDepositAccount.mockRejectedValue(
        expectedError,
      );

      await expect(
        resolver.validateDepositAccount(mockInput, {
          req: {
            headers: {
              'user-person': {
                email: 'test@test.com',
                phoneNumber: '12345679',
                identification: 'order-id',
              },
              'auth-token': {
                sessionId: 'test-session-Id',
                deviceId: 'test-device-id',
              },
              'client-info': { cifAccount: 'CIF123456' },
              trackingid: 'test-trackinId',
              'x-public-ip': 'test-ip',
            },
          },
        }),
      ).rejects.toThrow(expectedError);
    });
  });
});
