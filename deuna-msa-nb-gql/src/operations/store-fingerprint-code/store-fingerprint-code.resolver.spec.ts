import { Test, TestingModule } from '@nestjs/testing';
import { StoreFingeprintCodeResolver } from './store-fingerprint-code.resolver';
import { StoreFingeprintCodeService } from './services/store-fingerprint-code.service';
import { FingeprintCodeResponseDto } from './dto/fingerprint-code-response.dto';
import { FingeprintCodeInputDto } from './dto/fingerprint-code-input.dto';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';
import { GetUserPersonGuard } from './../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { ConfigService } from '@nestjs/config';
import { DecryptInputPipe } from '../../core/pipes/decrypt-input.pipe';

describe('StoreFingeprintCodeResolver', () => {
  let resolver: StoreFingeprintCodeResolver;
  let storeFingeprintCodeService: jest.Mocked<StoreFingeprintCodeService>;

  beforeEach(async () => {
    const mockStoreFingeprintCodeService = {
      storeFingeprintCode: jest.fn(),
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
        StoreFingeprintCodeResolver,
        {
          provide: StoreFingeprintCodeService,
          useValue: mockStoreFingeprintCodeService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        Reflector,
      ],
    })
      .overridePipe(DecryptInputPipe)
      .useValue({ transform: (value) => value })
      .overrideGuard(ValidationAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetUserPersonGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetClientGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<StoreFingeprintCodeResolver>(
      StoreFingeprintCodeResolver,
    );
    storeFingeprintCodeService = module.get(
      StoreFingeprintCodeService,
    ) as jest.Mocked<StoreFingeprintCodeService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('storeFingeprintCode', () => {
    it('should call StoreFingeprintCodeService.storeFingeprintCode and return the result', async () => {
      const mockInput: FingeprintCodeInputDto = {
        onboardingSessionId: '6f9aae94-1818-41cf-8cdc-ca7b0f4271c3',
        sessionId: 'mock-actual-session-id-for-trackingbase',
        nationalID: 'test-session-id',
        fingerprintData: 'test-fingerprint-data-id',
        identificationNumber: 'test-id-number',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
      };

      const expectedResponse: FingeprintCodeResponseDto = {
        status: 'SUCCESS',
        message: '',
      };

      storeFingeprintCodeService.storeFingeprintCode.mockResolvedValue(
        expectedResponse,
      );

      const mockContext = {
        req: {
          headers: {
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
          },
        },
      };

      const result = await resolver.storeFingeprintCode(
        mockInput,
        mockContext,
        'test-x-session-id',
      );

      expect(
        storeFingeprintCodeService.storeFingeprintCode,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          onboardingSessionId: '6f9aae94-1818-41cf-8cdc-ca7b0f4271c3',
          sessionId: 'test-x-session-id',
          nationalID: 'test-session-id',
          fingerprintData: 'test-fingerprint-data-id',
          identificationNumber: '0990752508001',
          trackingId: expect.any(String),
          requestId: expect.any(String),
        }),
      );

      expect(result).toEqual(expectedResponse);
    });

    it('should generate a new sessionId if not provided', async () => {
      const mockInput: FingeprintCodeInputDto = {
        onboardingSessionId: '6f9aae94-1818-41cf-8cdc-ca7b0f4271c3',
        nationalID: 'test-session-id',
        fingerprintData: 'test-fingerprint-data-id',
        identificationNumber: 'test-id-number',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
        sessionId: null,
      };
      storeFingeprintCodeService.storeFingeprintCode.mockResolvedValue({
        status: 'SUCCESS',
        message: 'OK',
      });
      const mockContext = {
        req: {
          headers: {
            'client-info': {
              identification: '0990752508001',
            },
          },
        },
      };

      await resolver.storeFingeprintCode(mockInput, mockContext, null);

      expect(
        storeFingeprintCodeService.storeFingeprintCode,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.any(String),
        }),
      );
    });

    it('should throw error when identificationNumber is missing', async () => {
      jest.clearAllMocks();

      const mockInput: FingeprintCodeInputDto = {
        onboardingSessionId: '6f9aae94-1818-41cf-8cdc-ca7b0f4271c3',
        sessionId: 'mock-actual-session-id-for-trackingbase2',
        nationalID: 'test-session-id',
        fingerprintData: 'test-fingerprint-data-id',
        identificationNumber: undefined,
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
      };

      const mockContext = {
        req: {
          headers: {
            'client-info': {
              id: 'client-id',
              identification: null,
              identificationType: 'RUC',
              businessName: 'Test Business',
              comercialName: 'Test Commerce',
              status: 'ACTIVE',
              coordinator: 'test@test.com',
              clientAcountId: '123456',
              cifAccount: '654321',
            },
          },
        },
      };

      await expect(
        resolver.storeFingeprintCode(
          mockInput,
          mockContext,
          'test-x-session-id',
        ),
      ).rejects.toThrow(
        'Identification number is required, identification number is missing',
      );
    });
  });
});
