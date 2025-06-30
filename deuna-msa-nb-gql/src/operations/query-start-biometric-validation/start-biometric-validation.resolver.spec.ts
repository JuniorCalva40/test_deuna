import { Test, TestingModule } from '@nestjs/testing';
import { StartBiometricValidationResolver } from './start-biometric-validation.resolver';
import { StartBiometricValidationService } from './services/start-biometric-validation.service';
import { StartBiometricValidationInputDto } from './dto/start-biometric-validation-input.dto';
import { StartBiometricValidationResponseDto } from './dto/start-biometric-validation-response.dto';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { ClientInfo } from '../../core/schema/merchat-client.schema';

describe('StartBiometricValidationResolver', () => {
  let resolver: StartBiometricValidationResolver;
  let service: jest.Mocked<StartBiometricValidationService>;

  beforeEach(async () => {
    const mockService = {
      startBiometricValidation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        StartBiometricValidationResolver,
        {
          provide: StartBiometricValidationService,
          useValue: mockService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'KYC_ENABLE_VALIDATION_AUTH_GUARD') return 'true';
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_EXPIRATION_TIME') return '1h';
              return null;
            }),
          },
        },
        ValidationAuthGuard,
        GetUserPersonGuard,
        GetClientGuard,
      ],
    })
      .overrideGuard(ValidationAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetUserPersonGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetClientGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<StartBiometricValidationResolver>(
      StartBiometricValidationResolver,
    );
    service = module.get(
      StartBiometricValidationService,
    ) as jest.Mocked<StartBiometricValidationService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('startBiometricValidation', () => {
    it('should call service.startBiometricValidation with correct parameters', async () => {
      const input: StartBiometricValidationInputDto = {
        facialAndLivenessValidation: {
          token1: 'base64-token1',
          token2: 'base64-token2',
          method: 3,
        },
        onboardingSessionId: 'test-onboarding-session-id',
      } as StartBiometricValidationInputDto;

      const sessionId = 'test-session-id';
      const mockIdentificationNumber = 'test-id-number';
      const context = {
        req: {
          headers: {
            'client-info': {
              identification: mockIdentificationNumber,
            } as ClientInfo,
          },
        },
      };

      const expectedResponse: StartBiometricValidationResponseDto = {
        scanId: 'test-scan-id',
        status: 'SUCCESS',
      };

      service.startBiometricValidation.mockResolvedValue(expectedResponse);

      const result = await resolver.startBiometricValidation(
        input,
        sessionId,
        context as any,
      );

      expect(service.startBiometricValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          facialAndLivenessValidation: input.facialAndLivenessValidation,
          onboardingSessionId: input.onboardingSessionId,
          identificationNumber: mockIdentificationNumber,
          sessionId: sessionId,
          trackingId: expect.any(String),
          requestId: expect.any(String),
        }),
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should generate a new sessionId if not provided', async () => {
      const input: StartBiometricValidationInputDto = {
        facialAndLivenessValidation: {
          token1: 'base64-token1',
          token2: 'base64-token2',
          method: 3,
        },
        onboardingSessionId: 'test-onboarding-session-id',
      } as StartBiometricValidationInputDto;
      const context = {
        req: {
          headers: {
            'client-info': {
              identification: 'test-id-number',
            } as ClientInfo,
          },
        },
      };

      service.startBiometricValidation.mockResolvedValue({
        scanId: 'test-scan-id',
        status: 'SUCCESS',
      });

      await resolver.startBiometricValidation(input, null, context as any);

      expect(service.startBiometricValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.any(String),
        }),
      );
    });

    it('should handle errors from service', async () => {
      const input: StartBiometricValidationInputDto = {
        facialAndLivenessValidation: {
          token1: 'base64-token1',
          token2: 'base64-token2',
          method: 3,
        },
        onboardingSessionId: 'test-onboarding-session-id',
      } as StartBiometricValidationInputDto;

      const sessionId = 'test-session-id';
      const context = {
        req: {
          headers: {
            'client-info': { identification: 'test-id-number' } as ClientInfo,
          },
        },
      };

      const expectedError = new Error('Test error');

      service.startBiometricValidation.mockImplementation(() => {
        throw expectedError;
      });

      await expect(
        resolver.startBiometricValidation(input, sessionId, context as any),
      ).rejects.toThrow(expectedError);
    });

    it('should throw error when identificationNumber is missing', async () => {
      const input: StartBiometricValidationInputDto = {
        facialAndLivenessValidation: {
          token1: 'base64-token1',
          token2: 'base64-token2',
          method: 3,
        },
        onboardingSessionId: 'test-onboarding-session-id',
      } as StartBiometricValidationInputDto;

      const sessionId = 'test-session-id';
      const context = {
        req: {
          headers: {
            'client-info': { identification: null } as ClientInfo,
          },
        },
      };

      await expect(
        resolver.startBiometricValidation(input, sessionId, context as any),
      ).rejects.toThrow(
        'Identification number is required, identification number is missing in biometric validation',
      );
    });
  });
});
