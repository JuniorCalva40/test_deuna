import { Test, TestingModule } from '@nestjs/testing';
import { ExecuteDepositResolver } from './execute-deposit.resolver';
import { ExecuteDepositService } from './service/execute-deposit.service';
import {
  ExecuteDepositInput,
  ExecuteDepositResponse,
} from './dto/execute-deposit.dto';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { Reflector } from '@nestjs/core';

describe('ExecuteDepositResolver', () => {
  let resolver: ExecuteDepositResolver;
  let executeDepositService: jest.Mocked<ExecuteDepositService>;

  beforeEach(async () => {
    const mockExecuteDepositService = {
      executeDeposit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [
        ValidationAuthGuard,
        ExecuteDepositResolver,
        {
          provide: ExecuteDepositService,
          useValue: mockExecuteDepositService,
        },
        Reflector,
      ],
    }).compile();

    resolver = module.get<ExecuteDepositResolver>(ExecuteDepositResolver);
    executeDepositService = module.get(
      ExecuteDepositService,
    ) as jest.Mocked<ExecuteDepositService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('executeDeposit', () => {
    it('should call ExecuteDepositService.executeDeposit and return the result', async () => {
      const mockInput: ExecuteDepositInput = {
        transactionId: 'TRANS-123',
      };

      const expectedResponse: ExecuteDepositResponse = {
        message: 'Deposit successfully processed',
        status: 'SUCCESS',
      };

      const mockContext = {
        req: {
          headers: {
            'user-person': {
              email: 'test@example.com',
              username: 'testUser',
            },
            'auth-token': {
              deviceId: 'device123',
              sessionId: 'session123',
            },
            'x-public-ip': '127.0.0.1',
          },
        },
      };

      executeDepositService.executeDeposit.mockResolvedValue(expectedResponse);

      const result = await resolver.confirmCellPhoneDeposit(mockInput, mockContext);

      expect(executeDepositService.executeDeposit).toHaveBeenCalledWith(
        mockInput,
        'device123',
        'session123',
        '127.0.0.1',
        'session123',
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from ExecuteDepositService.executeDeposit', async () => {
      const mockInput: ExecuteDepositInput = {
        transactionId: 'TRANS-123',
      };

      const expectedError = new Error('Test error');

      const mockContext = {
        req: {
          headers: {
            'user-person': { email: 'test@example.com', username: 'testUser' },
            'auth-token': { deviceId: 'device123', sessionId: 'session123' },
            'x-public-ip': '127.0.0.1',
          },
        },
      };

      executeDepositService.executeDeposit.mockRejectedValue(expectedError);

      await expect(
        resolver.confirmCellPhoneDeposit(mockInput, mockContext),
      ).rejects.toThrow(expectedError);
    });
  });
});
