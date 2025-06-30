import { Test, TestingModule } from '@nestjs/testing';
import { AcceptContractResolver } from './accept-contract.resolver';
import { AcceptContractService } from './services/accept-contract.service';
import { AcceptContractDataResponseDto } from './dto/accept-contract-response.dto';
import { AcceptContractDataInputDto } from './dto/accept-contract-input.dto';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

describe('AcceptContractResolver', () => {
  let resolver: AcceptContractResolver;
  let acceptContractService: jest.Mocked<AcceptContractService>;

  beforeEach(async () => {
    const mockAcceptContractService = {
      startAcceptContract: jest.fn(),
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
        AcceptContractResolver,
        { provide: AcceptContractService, useValue: mockAcceptContractService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    resolver = module.get<AcceptContractResolver>(AcceptContractResolver);
    acceptContractService = module.get(
      AcceptContractService,
    ) as jest.Mocked<AcceptContractService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('acceptContract', () => {
    it('debería llamar a acceptContractService.startAcceptContract y devolver el resultado', async () => {
      const mockInput: AcceptContractDataInputDto = {
        onboardingSessionId: 'test-session-id',
        businessDeviceId: 'test-device-id',
        deviceName: 'test-device-name',
      };

      const expectedResponse: AcceptContractDataResponseDto = {
        onboardingSessionId: 'test-session-id',
        requestId: 'test-request-id',
        otpResponse: {
          expirationDate: '2023-06-15T10:00:00Z',
          remainingResendAttempts: 3,
        },
        status: 'SUCCESS',
        email: 'test@test.com',
      };

      acceptContractService.startAcceptContract.mockResolvedValue(
        expectedResponse,
      );

      const result = await resolver.acceptContract(mockInput, {
        req: {
          headers: {
            'user-person': {
              email: 'test@test.com',
            },
            'client-info': {
              identification: '1234567890',
            },
          },
        },
      });

      expect(acceptContractService.startAcceptContract).toHaveBeenCalledWith(
        mockInput,
        'test@test.com',
        '1234567890',
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from acceptContractService.startAcceptContract', async () => {
      const mockInput: AcceptContractDataInputDto = {
        onboardingSessionId: 'test-session-id',
        businessDeviceId: 'test-device-id',
        deviceName: 'test-device-name',
      };

      const expectedError = new Error(
        'Customer info is required, customer info is missing',
      );

      acceptContractService.startAcceptContract.mockRejectedValue(
        expectedError,
      );

      await expect(
        resolver.acceptContract(mockInput, {
          req: {
            headers: {
              'user-person': {
                email: 'test@test.com',
              },
            },
          },
        }),
      ).rejects.toThrow(expectedError);
    });

    it('should throw an error when customerInfo is missing', async () => {
      const mockInput: AcceptContractDataInputDto = {
        onboardingSessionId: 'test-session-id',
        businessDeviceId: 'test-device-id',
        deviceName: 'test-device-name',
      };

      const expectedError = new Error(
        'Customer info is required, customer info is missing',
      );
      await expect(
        resolver.acceptContract(mockInput, {
          req: {
            headers: {
              'user-person': {
                email: 'test@test.com',
              },
            },
          },
        }),
      ).rejects.toThrow(expectedError);
    });
  });
});
