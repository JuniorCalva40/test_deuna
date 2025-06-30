import { Test, TestingModule } from '@nestjs/testing';
import { DocumentValidationService } from './document-validation.service';
import { MSA_NB_CNB_ORQ_SERVICE } from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { ServiceDocumentValidationDto } from '../dto/document-validation-input.dto';
import { DocumentValidationType } from '../../../common/constants/common';
import { of, throwError } from 'rxjs';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { ApolloError } from 'apollo-server-express';
import { v4 as uuidv4 } from 'uuid';

// Mockear el módulo uuid para asegurar un valor constante en las pruebas
jest.mock('uuid');

describe('DocumentValidationService', () => {
  let service: DocumentValidationService;
  let msaNbCnbOrqServiceMock: any;

  const mockInput: ServiceDocumentValidationDto = {
    frontsideImage: 'base64-frontside-image',
    backsideImage: 'base64-backside-image',
    country: 'EC',
    idType: DocumentValidationType.ID_CARD,
    onboardingSessionId: 'onboarding-session-id-123',
    trackingId: 'tracking-id-123',
    sessionId: 'session-id-123',
    requestId: 'request-id-123',
    merchantIdScanReference: 'merchant-scan-ref-123',
    identificationNumber: '12345678',
  };

  const mockSuccessResponse = {
    statusValidation: 'APPROVED',
  };

  const mockUpdateElectronicSignResponse = {
    status: 'SUCCESS',
  };

  const mockUuid = 'b7f8060f-8630-442a-86a8-ba8df1c5dac5';

  beforeEach(async () => {
    // Configurar el mock para uuidv4
    (uuidv4 as jest.Mock).mockReturnValue(mockUuid);

    msaNbCnbOrqServiceMock = {
      documentValidation: jest.fn(),
      updateElectronicSign: jest
        .fn()
        .mockResolvedValue(mockUpdateElectronicSignResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentValidationService,
        {
          provide: MSA_NB_CNB_ORQ_SERVICE,
          useValue: msaNbCnbOrqServiceMock,
        },
      ],
    }).compile();

    service = module.get<DocumentValidationService>(DocumentValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startDocumentValidation', () => {
    it('should return success response when validation is successful', async () => {
      msaNbCnbOrqServiceMock.documentValidation.mockReturnValue(
        of(mockSuccessResponse),
      );

      const result = await service.startDocumentValidation(mockInput);

      expect(msaNbCnbOrqServiceMock.documentValidation).toHaveBeenCalledWith(
        {
          merchantIdScanReference: mockInput.merchantIdScanReference,
          frontsideImage: mockInput.frontsideImage,
          backsideImage: mockInput.backsideImage,
          country: mockInput.country,
          idType: mockInput.idType,
          onboardingSessionId: mockInput.onboardingSessionId,
        },
        expect.anything(),
      );
      expect(msaNbCnbOrqServiceMock.updateElectronicSign).toHaveBeenCalledWith(
        {
          identificationNumber: mockInput.identificationNumber,
          fileIdentificationFront: mockInput.frontsideImage,
          fileIdentificationBack: mockInput.backsideImage,
        },
        {
          sessionId: mockInput.sessionId,
          trackingId: mockInput.trackingId,
          requestId: mockUuid,
        },
      );
      expect(result).toEqual({
        statusValidation: 'APPROVED',
        status: 'SUCCESS',
      });
    });

    it('should handle error when validation service returns null', async () => {
      msaNbCnbOrqServiceMock.documentValidation.mockReturnValue(of(null));

      try {
        await service.startDocumentValidation(mockInput);
        fail('Expected an exception to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.extensions.errorResponse).toBeDefined();
        expect(error.extensions.errorResponse.status).toBe('ERROR');
        expect(error.extensions.errorResponse.errors[0].code).toBe(
          ErrorCodes.DOC_FORMAT_INVALID,
        );
        expect(error.extensions.errorResponse.errors[0].message).toBe(
          '[DOCUMENT-VALIDATION] Error: NB_ERR_1606',
        );
      }
    });

    it('should handle error when electronic signature update fails', async () => {
      msaNbCnbOrqServiceMock.documentValidation.mockReturnValue(
        of(mockSuccessResponse),
      );
      msaNbCnbOrqServiceMock.updateElectronicSign.mockResolvedValue(null);

      try {
        await service.startDocumentValidation(mockInput);
        fail('Expected an exception to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.extensions.errorResponse).toBeDefined();
        expect(error.extensions.errorResponse.status).toBe('ERROR');
        expect(error.extensions.errorResponse.errors[0].code).toBe(
          'NB_ERR_301',
        );
      }
    });

    it('should handle error when validation service throws exception', async () => {
      msaNbCnbOrqServiceMock.documentValidation.mockReturnValue(
        throwError(() => new Error('Service error')),
      );

      try {
        await service.startDocumentValidation(mockInput);
        fail('Expected an exception to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.extensions.errorResponse).toBeDefined();
        expect(error.extensions.errorResponse.status).toBe('ERROR');
        expect(error.extensions.errorResponse.errors[0].code).toBe(
          ErrorCodes.DOC_FORMAT_INVALID,
        );
        expect(error.extensions.errorResponse.errors[0].message).toBe(
          '[DOCUMENT-VALIDATION] Error: NB_ERR_1606',
        );
      }
    });

    it('should pass empty string for merchantIdScanReference when not provided', async () => {
      msaNbCnbOrqServiceMock.documentValidation.mockReturnValue(
        of(mockSuccessResponse),
      );

      const inputWithoutMerchantRef = { ...mockInput };
      delete inputWithoutMerchantRef.merchantIdScanReference;

      await service.startDocumentValidation(inputWithoutMerchantRef);
      expect(msaNbCnbOrqServiceMock.documentValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          merchantIdScanReference: '',
        }),
        expect.anything(),
      );
    });
  });
});
