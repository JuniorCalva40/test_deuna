import { Test, TestingModule } from '@nestjs/testing';
import { DocumentValidationResolver } from './document-validation.resolver';
import { DocumentValidationService } from './service/document-validation.service';
import { DocumentValidationStartDto } from './dto/document-validation-input.dto';
import { DocumentValidationType } from '../../common/constants/common';
import { ApolloError } from 'apollo-server-express';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { Reflector } from '@nestjs/core';
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';

describe('DocumentValidationResolver', () => {
  let resolver: DocumentValidationResolver;
  let documentValidationService: jest.Mocked<DocumentValidationService>;

  const mockInput: DocumentValidationStartDto = {
    frontsideImage: 'base64-front-image',
    backsideImage: 'base64-back-image',
    country: 'PE',
    idType: DocumentValidationType.ID_CARD,
    onboardingSessionId: 'test-onboarding-session-id',
    sessionId: '',
    trackingId: '',
    requestId: '',
    identificationNumber: '',
  };

  const sessionId = 'test-session-id';
  const mockContext = {
    req: {
      headers: {
        'client-info': {
          identification: '12345678',
          identificationType: 'DNI',
          businessName: 'Test Business',
          comercialName: 'Test Commerce',
          status: 'ACTIVE',
          coordinator: 'test@test.com',
        },
        'user-person': {
          identification: '12345678',
        },
      },
    },
  };

  beforeEach(async () => {
    documentValidationService = {
      startDocumentValidation: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        HttpModule,
      ],
      providers: [
        DocumentValidationResolver,
        Reflector,
        {
          provide: DocumentValidationService,
          useValue: documentValidationService,
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

    resolver = module.get<DocumentValidationResolver>(
      DocumentValidationResolver,
    );
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('kycValidateDocument', () => {
    it('should successfully validate document', async () => {
      const mockResponse = {
        status: 'SUCCESS',
        statusValidation: 'APPROVED',
        scanReference: 'scan-123',
        timestamp: '2024-01-01T00:00:00Z',
        type: 'DNI',
      };

      documentValidationService.startDocumentValidation.mockResolvedValue(
        mockResponse,
      );

      const result = await resolver.kycValidateDocument(
        mockInput,
        sessionId,
        mockContext,
      );

      expect(result).toEqual(mockResponse);
      expect(
        documentValidationService.startDocumentValidation,
      ).toHaveBeenCalledWith({
        ...mockInput,
        sessionId,
        requestId: expect.any(String),
        trackingId: expect.any(String),
        merchantIdScanReference: expect.any(String),
        identificationNumber: '12345678',
      });
    });

    it('should generate sessionId if not provided', async () => {
      const mockResponse = {
        status: 'SUCCESS',
        statusValidation: 'APPROVED',
        scanReference: 'scan-123',
        timestamp: '2024-01-01T00:00:00Z',
        type: 'DNI',
      };
      documentValidationService.startDocumentValidation.mockResolvedValue(
        mockResponse,
      );
      await resolver.kycValidateDocument(mockInput, null, mockContext);
      expect(
        documentValidationService.startDocumentValidation,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.any(String),
        }),
      );
    });

    it('should handle service errors', async () => {
      const expectedError = new ApolloError('Test error');
      documentValidationService.startDocumentValidation.mockRejectedValue(
        expectedError,
      );

      documentValidationService.startDocumentValidation.mockImplementation(() => {
        throw expectedError;
      });

      await expect(
        resolver.kycValidateDocument(mockInput, sessionId, mockContext),
      ).rejects.toThrow(expectedError);

      expect(
        documentValidationService.startDocumentValidation,
      ).toHaveBeenCalledWith({
        ...mockInput,
        sessionId,
        requestId: expect.any(String),
        trackingId: expect.any(String),
        merchantIdScanReference: expect.any(String),
        identificationNumber: '12345678',
      });
    });

    it('should throw error when identificationNumber is missing', async () => {
      const contextWithoutClientInfo = {
        req: {
          headers: {
            'user-person': {
              identification: '12345678',
            },
          },
        },
      };

      await expect(
        resolver.kycValidateDocument(
          mockInput,
          sessionId,
          contextWithoutClientInfo,
        ),
      ).rejects.toThrow(
        'Identification number is required, identification number is missing',
      );

      expect(
        documentValidationService.startDocumentValidation,
      ).not.toHaveBeenCalled();
    });
  });
});
