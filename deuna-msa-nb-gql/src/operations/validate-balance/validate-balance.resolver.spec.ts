import { Test, TestingModule } from '@nestjs/testing';
import { ValidateBalanceResolver } from './validate-balance.resolver';
import { ValidateBalanceService } from './services/validate-balance.service';
import { ValidateBalanceResponseDto } from './dto/validate-balance-response.dto';
import { ValidateBalanceInputDto } from './dto/validate-balance-input.dto';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { createMockContext } from '../../core/test-utils/gql-context-mock';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

describe('ValidateBalanceResolver', () => {
  let resolver: ValidateBalanceResolver;
  let validateBalanceService: jest.Mocked<ValidateBalanceService>;
  const userName = 'testUser';

  beforeEach(async () => {
    const mockValidateBalanceService = {
      validateBalance: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [
        ValidateBalanceResolver,
        ValidationAuthGuard,
        GetUserPersonGuard,
        {
          provide: ValidateBalanceService,
          useValue: mockValidateBalanceService,
        },
      ],
    }).compile();

    resolver = module.get<ValidateBalanceResolver>(ValidateBalanceResolver);
    validateBalanceService = module.get(
      ValidateBalanceService,
    ) as jest.Mocked<ValidateBalanceService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('validateBalance', () => {
    it('should call validateBalanceService.validateBalance and return the result', async () => {
      const input: ValidateBalanceInputDto = {
        ammount: 100,
      };

      const expectedResponse: ValidateBalanceResponseDto = {
        isValidAmmount: true,
        availableBalance: 123,
      };

      const user = { identification: 'test-identification' };

      // Mock the service call
      validateBalanceService.validateBalance.mockResolvedValue(
        expectedResponse,
      );

      // Create a mock context
      const mockContext = createMockContext({
        req: {
          headers: {
            'auth-token': {
              data: {
                ip: '0.0.0.0',
                username: userName,
                personInfo: {
                  identification: user.identification,
                },
              },
              sessionId: '',
              deviceId: '',
              signature: '',
              tokenType: '',
              role: '',
            },
            'client-info': {
              id: 'e941991b-1ad4-4803-ae14-59c6619c881b',
              clientAcountId: '88000000091',
              cifAccount: '1599607',
              identification: '0990752508001',
              identificationType: 'RUC',
              businessName: 'Helado Bueno DEV',
              comercialName: 'Helado bueno',
              status: 'ACTIVE',
              coordinator: 'jchurovi@pichincha.com',
            },
            'user-person': {
              id: '123',
              email: 'test@test.com',
              status: 'ACTIVE',
              identification: user.identification,
            },
          },
        },
      });

      const result = await resolver.validateBalance(input, mockContext);

      expect(validateBalanceService.validateBalance).toHaveBeenCalledWith({
        ammount: input.ammount,
        identification: user.identification,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from validateBalanceService.validateBalance', async () => {
      const input: ValidateBalanceInputDto = {
        ammount: 100,
      };

      const expectedError = new Error('Test error');
      validateBalanceService.validateBalance.mockRejectedValue(expectedError);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const user = { identification: 'test-identification' };

      const mockContext = createMockContext({
        req: {
          headers: {
            'auth-token': {
              data: {
                ip: '0.0.0.0',
                username: userName,
                personInfo: {
                  identification: '',
                },
              },
              sessionId: '',
              deviceId: '',
              signature: '',
              tokenType: '',
              role: '',
            },
            'client-info': {
              id: 'e941991b-1ad4-4803-ae14-59c6619c881b',
              clientAcountId: '88000000091',
              cifAccount: '1599607',
              identification: '0990752508001',
              identificationType: 'RUC',
              businessName: 'Helado Bueno DEV',
              comercialName: 'Helado bueno',
              status: 'ACTIVE',
              coordinator: 'jchurovi@pichincha.com',
            },
            'user-person': {
              id: '123',
              email: 'test@test.com',
              status: 'ACTIVE',
            },
          },
        },
      });

      await expect(
        resolver.validateBalance(input, mockContext),
      ).rejects.toThrow(expectedError);
    });
  });
});
