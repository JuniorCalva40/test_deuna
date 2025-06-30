import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmDataResolver } from './confirm-data.resolver';
import { ConfirmDataService } from './services/confirm-data.service';
import { ConfirmDataInputDto } from './dto/confirm-data-input.dto';
import { ConfirmDataResponseDto } from './dto/confirm-data-response.dto';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';

describe('ConfirmDataResolver', () => {
  let resolver: ConfirmDataResolver;
  let confirmDataService: jest.Mocked<ConfirmDataService>;

  beforeEach(async () => {
    const mockConfirmDataService = {
      startConfirmData: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'BYPASS_VALIDATION_AUTH':
            return 'false';
          default:
            return '';
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [
        ConfirmDataResolver,
        { provide: ConfirmDataService, useValue: mockConfirmDataService },
        { provide: ConfigService, useValue: mockConfigService },
        Reflector,
      ],
    })
      .overrideGuard(ValidationAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetUserPersonGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetClientGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<ConfirmDataResolver>(ConfirmDataResolver);
    confirmDataService = module.get(
      ConfirmDataService,
    ) as jest.Mocked<ConfirmDataService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('confirmData', () => {
    it('should call confirmDataService.startConfirmData and return the result', async () => {
      const mockInput: ConfirmDataInputDto = {
        sessionId: 'test-session-id',
        onboardingSessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
        identificationNumber: 'test-id-number',
        establishment: {
          fullAddress: 'Test Address 123',
          numberEstablishment: '001',
        },
      };

      const expectedResponse: ConfirmDataResponseDto = {
        onboardingSessionId: 'test-session-id',
        status: 'SUCCESS',
      };

      confirmDataService.startConfirmData.mockResolvedValue(expectedResponse);

      const mockContext = {
        req: {
          headers: {
            'client-info': {
              identification: 'test-id-number',
              identificationType: 'DNI',
              businessName: 'Test Business',
              comercialName: 'Test Commerce',
              status: 'ACTIVE',
              coordinator: 'test@test.com',
            },
            'user-person': {
              identification: 'test-id-number',
            },
          },
        },
      };

      const result = await resolver.confirmData(
        'test-session-id',
        mockContext,
        mockInput,
      );

      expect(confirmDataService.startConfirmData).toHaveBeenCalledWith(
        expect.objectContaining({
          onboardingSessionId: mockInput.onboardingSessionId,
          sessionId: mockInput.sessionId,
          establishment: mockInput.establishment,
          identificationNumber: 'test-id-number',
          trackingId: expect.any(String),
          requestId: expect.any(String),
        }),
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should generate a new sessionId if not provided', async () => {
      const mockInput: ConfirmDataInputDto = {
        onboardingSessionId: 'test-onboarding-session-id',
        establishment: {
          fullAddress: 'Test Address 123',
          numberEstablishment: '001',
        },
        identificationNumber: '',
        sessionId: '',
        trackingId: '',
        requestId: '',
      };

      const expectedResponse: ConfirmDataResponseDto = {
        onboardingSessionId: 'test-session-id',
        status: 'SUCCESS',
      };

      confirmDataService.startConfirmData.mockResolvedValue(expectedResponse);

      const mockContext = {
        req: {
          headers: {
            'client-info': {
              identification: 'test-id-number',
            },
          },
        },
      };

      await resolver.confirmData(null, mockContext, mockInput);

      expect(confirmDataService.startConfirmData).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.any(String),
        }),
      );
    });

    it('should handle errors from confirmDataService.startConfirmData', async () => {
      const mockInput: ConfirmDataInputDto = {
        sessionId: 'test-session-id',
        onboardingSessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
        identificationNumber: 'test-id-number',
        establishment: {
          fullAddress: 'Test Address 123',
          numberEstablishment: '001',
        },
      };

      const mockContext = {
        req: {
          headers: {
            'client-info': {
              identification: 'test-id-number',
              identificationType: 'DNI',
              businessName: 'Test Business',
              comercialName: 'Test Commerce',
              status: 'ACTIVE',
              coordinator: 'test@test.com',
            },
            'user-person': {
              identification: 'test-id-number',
            },
          },
        },
      };

      const expectedError = new Error('Test error');

      confirmDataService.startConfirmData.mockImplementation(() => {
        throw expectedError;
      });

      await expect(
        resolver.confirmData('test-session-id', mockContext, mockInput),
      ).rejects.toThrow(expectedError);
    });

    it('should throw error when identificationNumber is missing', async () => {
      const mockInput: ConfirmDataInputDto = {
        sessionId: 'test-session-id',
        onboardingSessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
        identificationNumber: 'test-id-number',
        establishment: {
          fullAddress: 'Test Address 123',
          numberEstablishment: '001',
        },
      };

      // Mock context with null identification
      const mockContext = {
        req: {
          headers: {
            'client-info': {
              identification: null, // Set identification to null to trigger the error
              identificationType: 'DNI',
              businessName: 'Test Business',
              comercialName: 'Test Commerce',
              status: 'ACTIVE',
              coordinator: 'test@test.com',
            },
            'user-person': {
              identification: null,
            },
          },
        },
      };

      // Act & Assert
      await expect(
        resolver.confirmData('test-session-id', mockContext, mockInput),
      ).rejects.toThrow(
        'Identification number is required, identification number is missing',
      );
    });
  });
});
