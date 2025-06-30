import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmDepositResolver } from './confirm-deposit.resolver';
import { ConfirmDepositService } from './services/confirm-deposit.service';
import { ConfirmDepositResponse } from './dto/confirm-deposit-response.dto';
import {
  ConfirmDepositInput,
  ConfirmDepositServiceInput,
} from './dto/confirm-deposit-input.dto';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

describe('ConfirmDepositResolver', () => {
  let resolver: ConfirmDepositResolver;
  let confirmDepositService: jest.Mocked<ConfirmDepositService>;

  beforeEach(async () => {
    const mockConfirmDepositService = {
      confirmDeposit: jest.fn(),
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
        ConfirmDepositResolver,
        {
          provide: ConfirmDepositService,
          useValue: mockConfirmDepositService,
        },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    resolver = module.get<ConfirmDepositResolver>(
      ConfirmDepositResolver,
    );
    confirmDepositService = module.get(
      ConfirmDepositService,
    ) as jest.Mocked<ConfirmDepositService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('confirmDeposit', () => {
    it('should call confirmDepositService.confirmDeposit and return the result', async () => {
      const mockInput: ConfirmDepositInput = {
        transactionId: 'test-transaction-id',
      };
    
      const expectedResponse: ConfirmDepositResponse = {
        status: 'SUCCESS',
        message: 'test-message',
        transactionNumber: 'test-transaction-number',
        transactionDate: 'test-transaction-date',
      };
    
      confirmDepositService.confirmDeposit.mockResolvedValue(expectedResponse);
    
      const context = {
        req: {
          headers: {
            'auth-token': {
              deviceId: 'device123',
              sessionId: 'session123',
            },
          },
        },
      };
    
      const result = await resolver.confirmDeposit(mockInput, context);
    
      expect(confirmDepositService.confirmDeposit).toHaveBeenCalledWith({
        transactionId: 'test-transaction-id',
        trackingId: 'session123',
        deviceId: 'device123',
      });
    
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from confirmDepositService.confirmDeposit', async () => {
      const mockInput: ConfirmDepositInput = {
        transactionId: '',
      };

      const expectedError = new Error(
        `Cannot read properties of undefined (reading 'sessionId')`,
      );

      confirmDepositService.confirmDeposit.mockRejectedValue(
        expectedError,
      );

      await expect(
        resolver.confirmDeposit(mockInput, {
          req: {
            headers: {
              'auth-token': {
                deviceId: 'device123',
                sessionId: 'session123',
              },
            },
          },
        }),
      ).rejects.toThrow(expectedError);
    });
  });
});
