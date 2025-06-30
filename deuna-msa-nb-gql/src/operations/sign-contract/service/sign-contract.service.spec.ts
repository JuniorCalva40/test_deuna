import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { SignContractService } from './sign-contract.service';
import { SignContractInput } from '../dto/sign-contract-input.dto';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { MSA_NB_CNB_ORQ_SERVICE } from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { GetAllOnboardingResponseDto } from '../../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { MSA_TL_TEMPLATE_GENERATOR_SERVICE } from '../../../external-services/msa-tl-template-generator/providers/msa-tl-template-generator.provider';
import { MSA_TL_NOTIFICATION_EMAIL_SERVICE } from '../../../external-services/msa-tl-notification-email/providers/msa-tl-notification-email.provider';
import { IMsaTlTemplateGeneratorService } from '../../../external-services/msa-tl-template-generator/interfaces/msa-tl-template-generator-service.interface';
import { MSA_MC_BO_CONFIGURATION_SERVICE } from '../../../external-services/msa-mc-bo-configuration/providers/msa-mc-bo-configuration.provider'; // Added
import {
  ClientDataContext,
  DocumentCreationContext,
  DocumentOutputParams,
  RequestContext,
  TemplateDetails,
} from './sign-contract.service';

const mockRequestContext: RequestContext = {
  sessionId: 'session-id',
  trackingId: 'tracking-id',
  requestId: 'request-id',
};
const mockClientDataContext: ClientDataContext = {
  commercialName: 'Test Commercial Name',
  identityId: '1234567890',
  email: 'test@example.com',
  principalContact: 'contact-test',
};
const mockDocumentCreationContext: DocumentCreationContext = {
  merchantId: 'merchant-id',
  identityId: 'id-from-ruc',
};

interface IMsaCoOnboardingStatusService {
  getOtpDataFromValidateOtpState: jest.Mock;
  getCompleteOnboardingStatus: jest.Mock;
  updateOnboardingState: jest.Mock;
  completeOnboarding: jest.Mock;
}

interface IMsaNbCnbOrqService {
  notifyOnboardingFinish: jest.Mock;
  startElectronicSignatureProcess: jest.Mock;
  generateDocument: jest.Mock;
}

interface IMsaTlNotificationEmailService {
  sendEmail: jest.Mock;
}

interface MockMsaMcBoConfigurationService {
  getNodeConfigByCode: jest.Mock;
}

interface ContractEmailContext {
  nodeId: string;
  onboardingIdentityId: string;
  onboardingFullName?: string;
  clientAccountId?: string;
  commercialName: string;
  email: string;
  principalContact: string; // Added principalContact
}

// Mock del Logger
jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  })),
}));

// Mock del ErrorHandler
jest.mock('../../../utils/error-handler.util', () => ({
  ErrorHandler: {
    handleError: jest.fn().mockImplementation(() => {
      // Not throw exception here, only register the method call
      return;
    }),
  },
}));

describe('SignContractService', () => {
  let service: SignContractService;
  let mockOnboardingService: jest.Mocked<IMsaCoOnboardingStatusService>;
  let mockCnbOrqService: jest.Mocked<IMsaNbCnbOrqService>;
  let mockTemplateGeneratorService: jest.Mocked<IMsaTlTemplateGeneratorService>;
  let mockNotificationEmailService: jest.Mocked<IMsaTlNotificationEmailService>;
  let mockMsaMcBoConfigurationService: jest.Mocked<MockMsaMcBoConfigurationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignContractService,
        {
          provide: MSA_CO_ONBOARDING_STATE_SERVICE,
          useValue: {
            getOtpDataFromValidateOtpState: jest.fn(),
            getCompleteOnboardingStatus: jest.fn(),
            updateOnboardingState: jest.fn(),
            completeOnboarding: jest.fn(),
          },
        },
        {
          provide: MSA_NB_CNB_ORQ_SERVICE,
          useValue: {
            notifyOnboardingFinish: jest.fn(),
            startElectronicSignatureProcess: jest.fn(),
            generateDocument: jest.fn(),
          },
        },
        {
          provide: MSA_TL_TEMPLATE_GENERATOR_SERVICE,
          useValue: {
            generateTemplate: jest.fn(), // This will be mocked on a per-test basis
          },
        },
        {
          provide: MSA_TL_NOTIFICATION_EMAIL_SERVICE,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: MSA_MC_BO_CONFIGURATION_SERVICE,
          useValue: {
            getNodeConfigByCode: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SignContractService>(SignContractService);
    mockOnboardingService = module.get(MSA_CO_ONBOARDING_STATE_SERVICE);
    mockCnbOrqService = module.get(MSA_NB_CNB_ORQ_SERVICE);
    mockTemplateGeneratorService = module.get(
      MSA_TL_TEMPLATE_GENERATOR_SERVICE,
    );
    mockNotificationEmailService = module.get(
      MSA_TL_NOTIFICATION_EMAIL_SERVICE,
    );
    mockMsaMcBoConfigurationService = module.get(
      MSA_MC_BO_CONFIGURATION_SERVICE,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signContract', () => {
    const mockInput: SignContractInput = {
      sessionId: 'test-session-id',
      onboardingSessionId: 'test-onboarding-session-id',
      trackingId: 'test-tracking-id',
      requestId: 'test-request-id',
      nodeId: 'test-node-id',
      latitude: '0',
      longitude: '0',
      clientCnbDocumentId: 'test-client-cnb-document-id',
      merchantId: 'test-merchant-id',
      clientAccountId: 'test-client-account-id', // Added
    };

    const mockOnboardingStatus: GetAllOnboardingResponseDto = {
      data: {
        'confirm-data': {
          data: {
            establishment: {
              numberEstablishment: '123',
            },
          },
        },
        'start-onb-cnb': {
          data: {
            email: 'test@example.com',
            fullName: 'Test Full Name', // Added
            companyName: 'Test Business From CompanyName',
            ruc: {
              razonSocial: 'Test Business',
              tipoContribuyente: 'NATURAL',
              numeroRuc: '1234567890', // Used as identityId
              addit: [
                {
                  numeroEstablecimiento: '123',
                  nombreFantasiaComercial: 'Test Store', // Used as commercialName
                  tipoEstablecimiento: 'COM',
                  direccionCompleta: 'Test Address',
                  estado: 'ACTIVO',
                  matriz: 'NO',
                },
              ],
            },
          },
        },
      },
      id: 0,
      sessionId: '',
      securitySeed: '',
      identityId: '', // This is a top-level field, not used by extractOnboardingData
      onbType: '',
      status: '',
      publicKey: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully sign contract including document and email flow', async () => {
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(mockOnboardingStatus),
      );
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        of({ status: 'SUCCESS', referenceTransaction: 'ref123' }),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(of({}));
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));
      mockMsaMcBoConfigurationService.getNodeConfigByCode.mockReturnValue(
        of({ configData: { principalContact: 'contact-12345' } }),
      );

      // Mocks for document generation and email sending
      mockTemplateGeneratorService.generateTemplate
        .mockReturnValueOnce(of({ generatedHtml: ['Contract HTML'] })) // For processContractDocumentCreation -> generateDynamicHtmlFromTemplate (contract)
        .mockReturnValueOnce(of({ generatedHtml: ['Billing Contract HTML'] })) // For processContractDocumentCreation -> generateDynamicHtmlFromTemplate (billing)
        .mockReturnValueOnce(of({ generatedHtml: ['Email Subject'] })) // For sendContractEmail (subject)
        .mockReturnValueOnce(of({ generatedHtml: ['Email Body'] })); // For sendContractEmail (body)
      mockCnbOrqService.generateDocument
        .mockReturnValueOnce(
          of({
            data: [{ signedUrl: 'contract-url', fileName: 'contract.pdf' }],
          }),
        ) // For processContractDocumentCreation -> createPdfDocumentFromHtml (contract)
        .mockReturnValueOnce(
          of({ data: [{ signedUrl: 'billing-url', fileName: 'billing.pdf' }] }),
        ); // For processContractDocumentCreation -> createPdfDocumentFromHtml (billing)

      mockNotificationEmailService.sendEmail.mockReturnValue(of({}));

      // Ensure merchantId is part of mockInput if not already
      mockInput.merchantId = 'test-merchant-id';
      const result = await service.signContract(mockInput);

      expect(result.status).toBe('SUCCESS');
      expect(result.message).toBe(
        'The contract signature submission process completed successfully.',
      );
      expect(result.details.getOtpDataResult).toBe('SUCCESS');
      expect(mockCnbOrqService.notifyOnboardingFinish).toHaveBeenCalled();
      expect(
        mockCnbOrqService.startElectronicSignatureProcess,
      ).toHaveBeenCalled();
      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).toHaveBeenCalledWith(mockInput.nodeId, 'CO001');
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).toHaveBeenCalledTimes(4);
      expect(mockCnbOrqService.generateDocument).toHaveBeenCalledTimes(2);
      expect(mockNotificationEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              fileName: 'contract.pdf',
              url: 'contract-url',
            }),
            expect.objectContaining({
              fileName: 'billing.pdf',
              url: 'billing-url',
            }),
          ]),
        }),
      );
    });

    beforeEach(() => {
      mockInput.merchantId = 'test-merchant-id'; // Ensure merchantId is set for tests that need it
    });

    it('should handle error when getting OTP data', async () => {
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        throwError(() => new Error('OTP retrieval failed')),
      );

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('OTP retrieval failed');
      expect(result.errorCode).toBe(ErrorCodes.AUTH_OTP_INVALID);
      expect(result.details.getOtpDataResult).toBe('FAIL');
    });

    it('should handle error when getting onboarding status', async () => {
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        throwError(() => new Error('Status retrieval failed')),
      );

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Status retrieval failed');
    });

    it('should handle error when notifying onboarding finish', async () => {
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(mockOnboardingStatus),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(
        throwError(() => new Error('Notification failed')),
      );
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Notification failed');
    });

    it('should handle missing onboarding data', async () => {
      const incompleteOnboardingStatus = {
        data: {
          // Missing required data
        },
      };

      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(incompleteOnboardingStatus as GetAllOnboardingResponseDto),
      );

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Required onboarding data not found');
    });

    it('should handle error when generating contract document', async () => {
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(mockOnboardingStatus),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(of({}));
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));

      // Simulate the failure to generate the template
      mockTemplateGeneratorService.generateTemplate.mockReturnValue(
        throwError(() => new Error('Template generation failed')),
      );

      // We need the signature process to still work to reach the correct section
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        of({ status: 'SUCCESS' }),
      );

      const result = await service.signContract(mockInput);

      // This test should verify the behavior with documentGenerationError
      // but the service continues despite the error
      expect(result.status).toBe('SUCCESS');
      expect(result.message).toBe(
        'The contract signature submission process completed successfully.',
      );
    });

    it('should handle error in electronic signature process', async () => {
      // Configure all services correctly first
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(mockOnboardingStatus),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(of({}));
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));

      // For this test, we need to configure the document flow correctly
      // so that it reaches the electronic signature point
      mockTemplateGeneratorService.generateTemplate
        .mockReturnValueOnce(
          of({ generatedHtml: ['<html>Test Contract</html>'] }),
        ) // For generateContractHtml
        .mockReturnValueOnce(of({ generatedHtml: ['Email Subject'] })) // For sendContractEmail (subject)
        .mockReturnValueOnce(of({ generatedHtml: ['Email Body'] })); // For sendContractEmail (body)
      mockCnbOrqService.generateDocument.mockReturnValue(
        of({ data: [{ signedUrl: 'test-url', fileName: 'test.pdf' }] }),
      );
      mockNotificationEmailService.sendEmail.mockReturnValue(of({}));

      // The key point: the electronic signature fails
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        throwError(() => new Error('Signature process failed')),
      );

      // Execute the service
      const result = await service.signContract(mockInput); // merchantId is in mockInput

      // The exception flow test
      // The service should continue and return success because it handles the error internally
      expect(result.status).toBe('SUCCESS');
      expect(result.message).toBe(
        'The contract signature submission process completed successfully.',
      );
      expect(result.details.getOtpDataResult).toBe('SUCCESS');
    });

    it('should handle error when updating onboarding state', async () => {
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(mockOnboardingStatus),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(of({}));

      // Simulate the error in the state update
      mockOnboardingService.updateOnboardingState.mockReturnValue(
        throwError(() => new Error('State update failed')),
      );

      // We don't need to configure completeOnboarding because updateOnboardingState fails before

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Failed to update onboarding state');
      expect(result.errorCode).toBe(ErrorCodes.ONB_STATUS_INVALID);
    });

    it('should handle RUC with missing numeroEstablecimiento in all addit entries', async () => {
      const incompleteRucData = {
        data: {
          'confirm-data': {
            data: {
              establishment: {
                numberEstablishment: '999', // A number that does not exist in the addit
              },
            },
          },
          'start-onb-cnb': {
            data: {
              email: 'test@example.com',
              companyName: 'Test Company Name',
              ruc: {
                razonSocial: 'Test Business',
                tipoContribuyente: 'NATURAL',
                rucNumber: '1234567890',
                addit: [
                  {
                    numeroEstablecimiento: '123',
                    nombreFantasiaComercial: null,
                    tipoEstablecimiento: 'COM',
                    direccionCompleta: 'Test Address',
                    estado: 'ACTIVO',
                    matriz: 'NO',
                  },
                ],
              },
            },
          },
        },
        id: 0,
        sessionId: '',
        securitySeed: '',
        identityId: '',
        onbType: '',
        status: '',
        publicKey: '',
        createdAt: undefined,
        updatedAt: undefined,
      } as GetAllOnboardingResponseDto;

      const result = (service as any).extractOnboardingData(incompleteRucData);

      expect(result.commercialName).toBe('Test Company Name'); // Should use companyName when the establishment is not found
      expect(result.establishmentType).toBe('');
      expect(result.fullAddress).toBe('');
      expect(result.status).toBe('');
    });

    it('should fully test error handling in document generation', async () => {
      // Configure the test so it passes through the catch block of generateContractDocument
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(mockOnboardingStatus),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(of({}));
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));

      // Configure the test so it generates the HTML correctly
      mockTemplateGeneratorService.generateTemplate.mockReturnValue(
        of({ generatedHtml: ['<html>Test</html>'] }),
      );

      // But it fails to create the document
      mockCnbOrqService.generateDocument.mockReturnValue(
        throwError(() => new Error('Document generation error')),
      );

      // And the electronic signature works
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        of({ status: 'SUCCESS' }),
      );

      const result = await service.signContract({
        ...mockInput,
        merchantId: 'test-merchant-id',
      });

      // Despite the document failure, the flow continues and returns SUCCESS
      expect(result.status).toBe('SUCCESS');
      expect(result.message).toBe(
        'The contract signature submission process completed successfully.',
      );
    });
  });

  describe('updateOnboardingState', () => {
    it('should successfully update onboarding state', async () => {
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));

      await (service as any).updateOnboardingState(
        'test-session',
        'session-id',
        'tracking-id',
        'request-id',
      );

      expect(mockOnboardingService.updateOnboardingState).toHaveBeenCalled();
      expect(mockOnboardingService.completeOnboarding).toHaveBeenCalled();
    });
  });

  describe('updateOnboardingState error handling', () => {
    it('should throw formatted error when completeOnboarding fails', async () => {
      const mockError = new Error('Completion failed');
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(
        throwError(() => mockError),
      );

      await expect(
        (service as any).updateOnboardingState(
          'test-session',
          'session-id',
          'tracking-id',
          'request-id',
        ),
      ).rejects.toMatchObject({
        message: 'Failed to update onboarding state',
        code: ErrorCodes.ONB_STATUS_INVALID,
        details: mockError,
      });
    });
  });

  describe('generateDynamicHtmlFromTemplate', () => {
    const mockOtp = '123456';
    const mockTemplateDetails: TemplateDetails = {
      name: 'test-template',
      path: 'test/path.html',
    };

    it('should generate contract HTML successfully', async () => {
      mockTemplateGeneratorService.generateTemplate.mockReturnValue(
        of({ generatedHtml: ['<html>mock</html>'] }),
      );

      const result = await (service as any).generateDynamicHtmlFromTemplate(
        mockClientDataContext,
        mockOtp,
        mockRequestContext,
        mockTemplateDetails,
      );

      expect(result).toBe('<html>mock</html>');
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          templateName: mockTemplateDetails.name,
          templatePath: mockTemplateDetails.path,
          dynamicData: expect.objectContaining({
            fullName: mockClientDataContext.commercialName,
            identification: mockClientDataContext.identityId,
            email: mockClientDataContext.email,
            principalContact: mockClientDataContext.principalContact,
            otp: mockOtp,
          }),
        }),
        { trackingId: mockRequestContext.trackingId },
      );
    });

    it('should throw error if commercialName is missing', async () => {
      const invalidClientData = {
        ...mockClientDataContext,
        commercialName: '',
      };
      await expect(
        (service as any).generateDynamicHtmlFromTemplate(
          invalidClientData,
          mockOtp,
          mockRequestContext,
          mockTemplateDetails,
        ),
      ).rejects.toThrow(ErrorCodes.CONTRACT_DATA_INVALID);
    });

    it('should throw error if identityId is missing', async () => {
      const invalidClientData = { ...mockClientDataContext, identityId: '' };
      await expect(
        (service as any).generateDynamicHtmlFromTemplate(
          invalidClientData,
          mockOtp,
          mockRequestContext,
          mockTemplateDetails,
        ),
      ).rejects.toThrow(ErrorCodes.CONTRACT_DATA_INVALID);
    });

    it('should throw error when template service fails', async () => {
      const templateError = new Error('Template generation failed');
      mockTemplateGeneratorService.generateTemplate.mockReturnValue(
        throwError(() => templateError),
      );

      await expect(
        (service as any).generateDynamicHtmlFromTemplate(
          mockClientDataContext,
          mockOtp,
          mockRequestContext,
          mockTemplateDetails,
        ),
      ).rejects.toThrow(templateError);
    });

    it('should throw error when empty HTML is generated', async () => {
      mockTemplateGeneratorService.generateTemplate.mockReturnValue(
        of({ generatedHtml: [] }),
      );
      await expect(
        (service as any).generateDynamicHtmlFromTemplate(
          mockClientDataContext,
          mockOtp,
          mockRequestContext,
          mockTemplateDetails,
        ),
      ).rejects.toMatchObject({
        code: ErrorCodes.CONTRACT_DATA_INVALID,
        message: 'Empty contract HTML generated',
      });
    });
  });

  describe('createPdfDocumentFromHtml', () => {
    const mockHtmlTemplate = '<html>test</html>';
    const mockOutputParams: DocumentOutputParams = {
      description: 'Test Doc',
      fileName: 'test-doc',
    };

    it('should create document successfully', async () => {
      mockCnbOrqService.generateDocument.mockReturnValue(
        of({ status: 'success', data: [{ signedUrl: 'test-url' }] }),
      );

      const result = await (service as any).createPdfDocumentFromHtml(
        mockHtmlTemplate,
        mockDocumentCreationContext,
        mockOutputParams,
        mockRequestContext,
      );

      expect(result).toBeDefined();
      expect(mockCnbOrqService.generateDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          commerceId: mockDocumentCreationContext.merchantId,
          htmlTemplate: mockHtmlTemplate,
          description: mockOutputParams.description,
          identification: mockDocumentCreationContext.identityId,
          fileName: mockOutputParams.fileName,
        }),
      );
    });

    it('should handle error when document creation fails', async () => {
      const docError = new Error('Document generation failed');
      mockCnbOrqService.generateDocument.mockReturnValue(
        throwError(() => docError),
      );

      await expect(
        (service as any).createPdfDocumentFromHtml(
          mockHtmlTemplate,
          mockDocumentCreationContext,
          mockOutputParams,
          mockRequestContext,
        ),
      ).rejects.toThrow(docError);
    });

    it('should throw error when HTML template is empty', async () => {
      await expect(
        (service as any).createPdfDocumentFromHtml(
          '',
          mockDocumentCreationContext,
          mockOutputParams,
          mockRequestContext,
        ),
      ).rejects.toMatchObject({
        code: ErrorCodes.DOC_SIGN_FAILED,
        message: 'Invalid HTML template for contract document',
      });
    });
  });

  describe('processContractDocumentCreation', () => {
    const mockOtp = '123456';
    const mockTemplateDetails: TemplateDetails = {
      name: 'contract-template',
      path: 'contract/path.html',
    };
    const mockOutputParams: DocumentOutputParams = {
      description: 'Contract Doc',
      fileName: 'contract-doc',
    };
    const mockHtml = '<html>Generated HTML</html>';
    const mockPdfResult = { data: [{ signedUrl: 'signed.url' }] };

    it('should successfully generate HTML and create PDF', async () => {
      mockTemplateGeneratorService.generateTemplate.mockReturnValueOnce(
        of({ generatedHtml: [mockHtml] }),
      );
      mockCnbOrqService.generateDocument.mockReturnValueOnce(
        of(mockPdfResult),
      );

      const result = await (service as any).processContractDocumentCreation(
        mockClientDataContext,
        mockOtp,
        mockRequestContext,
        mockDocumentCreationContext,
        mockTemplateDetails,
        mockOutputParams,
      );

      expect(result).toEqual(mockPdfResult);
      expect(mockTemplateGeneratorService.generateTemplate).toHaveBeenCalled();
      expect(mockCnbOrqService.generateDocument).toHaveBeenCalled();
    });

    it('should throw if HTML generation fails', async () => {
      mockTemplateGeneratorService.generateTemplate.mockReturnValueOnce(
        throwError(() => new Error('HTML gen error')),
      );

      await expect(
        (service as any).processContractDocumentCreation(
          mockClientDataContext,
          mockOtp,
          mockRequestContext,
          mockDocumentCreationContext,
          mockTemplateDetails,
          mockOutputParams,
        ),
      ).rejects.toThrow('HTML gen error');
      expect(mockCnbOrqService.generateDocument).not.toHaveBeenCalled();
    });

    it('should throw if PDF creation fails', async () => {
      mockTemplateGeneratorService.generateTemplate.mockReturnValueOnce(
        of({ generatedHtml: [mockHtml] }),
      );
      mockCnbOrqService.generateDocument.mockReturnValueOnce(
        throwError(() => new Error('PDF creation error')),
      );

      await expect(
        (service as any).processContractDocumentCreation(
          mockClientDataContext,
          mockOtp,
          mockRequestContext,
          mockDocumentCreationContext,
          mockTemplateDetails,
          mockOutputParams,
        ),
      ).rejects.toThrow('PDF creation error');
    });

    it('should throw an error if generated HTML is falsy (e.g., null from generateDynamicHtmlFromTemplate)', async () => {
      // Espiar el método privado y simular que devuelve null.
      // Esto es para probar directamente la lógica dentro de processContractDocumentCreation
      // si generateDynamicHtmlFromTemplate devolviera un valor falsy.
      const generateDynamicHtmlSpy = jest
        .spyOn(service as any, 'generateDynamicHtmlFromTemplate')
        .mockResolvedValue(null);

      await expect(
        (service as any).processContractDocumentCreation(
          mockClientDataContext,
          mockOtp,
          mockRequestContext,
          mockDocumentCreationContext,
          mockTemplateDetails,
          mockOutputParams,
        ),
      ).rejects.toThrow(
        `Failed to generate HTML for document: ${mockOutputParams.description} - ${mockOutputParams.fileName}`,
      );

      expect(generateDynamicHtmlSpy).toHaveBeenCalledWith(
        mockClientDataContext,
        mockOtp,
        mockRequestContext,
        mockTemplateDetails,
      );
      // Asegurarse de que createPdfDocumentFromHtml (y por lo tanto generateDocument) no fue llamado
      expect(mockCnbOrqService.generateDocument).not.toHaveBeenCalled();

      generateDynamicHtmlSpy.mockRestore(); // Restaurar el espía
    });
  });

  describe('sendContractEmail', () => {
    const mockDocumentResult = {
      data: [{ signedUrl: 'test-url', fileName: 'test.pdf' }],
    };
    const mockBillingDocumentResult = {
      data: [{ signedUrl: 'billing-test-url', fileName: 'billing.pdf' }],
    };
    const baseContext: ContractEmailContext = {
      nodeId: 'test-node-id',
      onboardingIdentityId: 'id-1234567890',
      commercialName: 'Test Commercial Name',
      email: 'test@example.com',
      onboardingFullName: 'Test Full Name',
      clientAccountId: 'acc-0987654321',
      principalContact: 'contact-1122334455', // Added principalContact
    };

    // Date mocking for consistent date/hour in email body
    beforeEach(() => {
      // Reset mocks for generateTemplate before each test in this describe block
      mockTemplateGeneratorService.generateTemplate.mockReset();
      mockMsaMcBoConfigurationService.getNodeConfigByCode.mockReset(); // Reset this mock as well
    });

    it('should send email successfully with valid identityId', async () => {
      mockTemplateGeneratorService.generateTemplate
        .mockReturnValueOnce(of({ generatedHtml: ['Test Subject'] }))
        .mockReturnValueOnce(of({ generatedHtml: ['Test Body'] }));
      mockNotificationEmailService.sendEmail.mockReturnValue(of({}));
      // No longer need to mock getNodeConfigByCode here as principalContact is in baseContext

      await (service as any).sendContractEmail(
        baseContext.email,
        mockDocumentResult,
        mockBillingDocumentResult,
        baseContext,
        'session-id',
        'tracking-id',
        'request-id',
      );

      // getNodeConfigByCode should NOT be called directly by sendContractEmail anymore
      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).not.toHaveBeenCalled();
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          templatePath:
            'cnb/notifications/email_electronic_service_contract_subject.html',
          dynamicData: {},
        }), // No dynamic data for subject
        { trackingId: 'tracking-id' },
      );
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          templatePath:
            'cnb/notifications/email_electronic_service_contract_body.html',
          dynamicData: expect.objectContaining({
            fullName: baseContext.onboardingFullName,
            identification: '******7890', // Masked onboardingIdentityId
            firstName: 'Test',
            accountNumber: '******4321', // Masked clientAccountId
            principalContact: '******4455', // Masked principalContact from context
            commercialName: baseContext.commercialName,
          }),
        }),
        { trackingId: 'tracking-id' },
      );
      expect(mockNotificationEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              fileName: mockDocumentResult.data[0].fileName,
              contentType: 'application/pdf',
              url: mockDocumentResult.data[0].signedUrl,
            }),
            expect.objectContaining({
              fileName: mockBillingDocumentResult.data[0].fileName,
              contentType: 'application/pdf',
              url: mockBillingDocumentResult.data[0].signedUrl,
            }),
          ]),
        }),
      );
      expect(mockNotificationEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should send email successfully with undefined onboardingFullName and clientAccountId, and principalContact from context', async () => {
      const testContext: ContractEmailContext = {
        ...baseContext,
        onboardingFullName: undefined,
        clientAccountId: undefined,
        principalContact: 'contact-from-context', // principalContact provided in context
      };
      mockTemplateGeneratorService.generateTemplate
        .mockReturnValueOnce(of({ generatedHtml: ['Test Subject'] }))
        .mockReturnValueOnce(of({ generatedHtml: ['Test Body'] }));
      mockNotificationEmailService.sendEmail.mockReturnValue(of({}));
      // No mock for getNodeConfigByCode needed here

      await (service as any).sendContractEmail(
        testContext.email,
        mockDocumentResult,
        mockBillingDocumentResult,
        testContext,
        'session-id',
        'tracking-id',
        'request-id',
      );

      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).not.toHaveBeenCalled();
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).toHaveBeenNthCalledWith(
        2, // Body template
        expect.objectContaining({
          templatePath:
            'cnb/notifications/email_electronic_service_contract_body.html',
          dynamicData: expect.objectContaining({
            fullName: testContext.commercialName, // Fallback to commercialName
            identification: '******7890', // Masked onboardingIdentityId
            firstName: 'Test', // First word of commercialName
            accountNumber: '******', // Default masked value
            principalContact: '******text', // Masked principalContact from context
            commercialName: testContext.commercialName,
          }),
        }),
        { trackingId: 'tracking-id' },
      );
      expect(mockNotificationEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should handle error when generating subject template fails', async () => {
      mockTemplateGeneratorService.generateTemplate.mockReturnValueOnce(
        throwError(() => new Error('Subject template generation failed')),
      );
      // No call to sendEmail should be made
      mockNotificationEmailService.sendEmail.mockReturnValue(of({}));
      // No mock for getNodeConfigByCode needed here

      await (service as any).sendContractEmail(
        baseContext.email,
        mockDocumentResult,
        mockBillingDocumentResult,
        baseContext,
        'session-id',
        'tracking-id',
        'request-id',
      );

      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).not.toHaveBeenCalled();
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).toHaveBeenCalledTimes(1);
      expect(mockNotificationEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should handle error when generating body template fails', async () => {
      mockTemplateGeneratorService.generateTemplate
        .mockReturnValueOnce(of({ generatedHtml: ['Test Subject'] })) // Subject success
        .mockReturnValueOnce(
          throwError(() => new Error('Body template generation failed')),
        ); // Body fail
      // No mock for getNodeConfigByCode needed here
      mockNotificationEmailService.sendEmail.mockReturnValue(of({}));

      await (service as any).sendContractEmail(
        baseContext.email,
        mockDocumentResult,
        mockBillingDocumentResult,
        baseContext,
        'session-id',
        'tracking-id',
        'request-id',
      );

      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).not.toHaveBeenCalled();
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).toHaveBeenCalledTimes(2);
      expect(mockNotificationEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should handle error when email sending fails', async () => {
      mockTemplateGeneratorService.generateTemplate
        .mockReturnValueOnce(of({ generatedHtml: ['Test Subject'] }))
        .mockReturnValueOnce(of({ generatedHtml: ['Test Body'] }));
      mockNotificationEmailService.sendEmail.mockReturnValue(
        throwError(() => new Error('Email sending failed')),
      );
      // No mock for getNodeConfigByCode needed here

      // Call the method, error is caught internally and logged
      await (service as any).sendContractEmail(
        baseContext.email,
        mockDocumentResult,
        mockBillingDocumentResult,
        baseContext,
        'session-id',
        'tracking-id',
        'request-id',
      );
      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).not.toHaveBeenCalled();
      expect(mockNotificationEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should handle missing email or document data and not call template generation', async () => {
      // Test with empty email
      await (service as any).sendContractEmail(
        '', // Empty email
        mockDocumentResult,
        mockBillingDocumentResult,
        baseContext,
        'session-id',
        'tracking-id',
        'request-id',
      );
      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).not.toHaveBeenCalled();
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).not.toHaveBeenCalled();
      expect(mockNotificationEmailService.sendEmail).not.toHaveBeenCalled();

      mockTemplateGeneratorService.generateTemplate.mockReset(); // Reset for next call
      mockNotificationEmailService.sendEmail.mockReset();

      // Test with missing signedUrl in documentResult
      await (service as any).sendContractEmail(
        baseContext.email,
        { data: [{ fileName: 'test.pdf' }] }, // Missing signedUrl
        mockBillingDocumentResult,
        baseContext,
        'session-id',
        'tracking-id',
        'request-id',
      );
      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).not.toHaveBeenCalled();
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).not.toHaveBeenCalled();
      expect(mockNotificationEmailService.sendEmail).not.toHaveBeenCalled();

      mockTemplateGeneratorService.generateTemplate.mockReset();
      mockNotificationEmailService.sendEmail.mockReset();

      // Test with missing signedUrl in billingDocumentResult
      await (service as any).sendContractEmail(
        baseContext.email,
        mockDocumentResult,
        { data: [{ fileName: 'billing.pdf' }] }, // Missing signedUrl in billing
        baseContext,
        'session-id',
        'tracking-id',
        'request-id',
      );
      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).not.toHaveBeenCalled();
      expect(
        mockTemplateGeneratorService.generateTemplate,
      ).not.toHaveBeenCalled();
      expect(mockNotificationEmailService.sendEmail).not.toHaveBeenCalled();
    });

    // This test is no longer relevant as getNodeConfigByCode is not called directly by sendContractEmail
    // it('should handle error when getNodeConfigByCode fails', async () => { ... });
  });

  describe('getPrincipalContact', () => {
    it('should return principalContact when API call is successful', async () => {
      const mockNodeId = 'test-node-id';
      const mockPrincipalContact = 'contact-from-api';
      mockMsaMcBoConfigurationService.getNodeConfigByCode.mockReturnValue(
        of({ configData: { principalContact: mockPrincipalContact } }),
      );

      const result = await (service as any).getPrincipalContact(
        { nodeId: mockNodeId },
        'session-id',
        'tracking-id',
        'request-id',
      );

      expect(result).toBe(mockPrincipalContact);
      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).toHaveBeenCalledWith(mockNodeId, 'CO001');
    });

    it('should return empty string when principalContact is not in API response', async () => {
      const mockNodeId = 'test-node-id';
      mockMsaMcBoConfigurationService.getNodeConfigByCode.mockReturnValue(
        of({ configData: {} }), // No principalContact in configData
      );

      const result = await (service as any).getPrincipalContact(
        { nodeId: mockNodeId },
        'session-id',
        'tracking-id',
        'request-id',
      );

      expect(result).toBe('');
      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).toHaveBeenCalledWith(mockNodeId, 'CO001');
    });

    it('should return empty string when API call fails', async () => {
      const mockNodeId = 'test-node-id';
      mockMsaMcBoConfigurationService.getNodeConfigByCode.mockReturnValue(
        throwError(() => new Error('API error')),
      );

      const result = await (service as any).getPrincipalContact(
        { nodeId: mockNodeId },
        'session-id',
        'tracking-id',
        'request-id',
      );

      expect(result).toBe('');
      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).toHaveBeenCalledWith(mockNodeId, 'CO001');
    });

    it('should return empty string when nodeId is not provided', async () => {
      const result = await (service as any).getPrincipalContact(
        { nodeId: null }, // No nodeId
        'session-id',
        'tracking-id',
        'request-id',
      );

      expect(result).toBe('');
      expect(
        mockMsaMcBoConfigurationService.getNodeConfigByCode,
      ).not.toHaveBeenCalled();
    });
  });

  describe('signContract with error handling in document generation', () => {
    const testInput: SignContractInput = {
      sessionId: 'test-session-id',
      onboardingSessionId: 'test-onboarding-session-id',
      trackingId: 'test-tracking-id',
      requestId: 'test-request-id',
      nodeId: 'test-node-id',
      latitude: '0',
      longitude: '0',
      clientCnbDocumentId: 'test-client-cnb-document-id',
      clientAccountId: 'test-client-account-id',
      merchantId: 'test-merchant-id', // Added merchantId
    };

    const testOnboardingStatus: GetAllOnboardingResponseDto = {
      data: {
        'confirm-data': {
          data: {
            establishment: {
              numberEstablishment: '123',
            },
          },
        },
        'start-onb-cnb': {
          data: {
            email: 'test@example.com',
            fullName: 'Test Full Name',
            ruc: {
              razonSocial: 'Test Business',
              tipoContribuyente: 'NATURAL',
              numeroRuc: '1234567890',
              addit: [
                {
                  numeroEstablecimiento: '123',
                  nombreFantasiaComercial: 'Test Store',
                  tipoEstablecimiento: 'COM',
                  direccionCompleta: 'Test Address',
                  estado: 'ACTIVO',
                  matriz: 'NO',
                },
              ],
            },
          },
        },
      },
      id: 0,
      sessionId: '',
      securitySeed: '',
      identityId: '', // This is a top-level field, not used by extractOnboardingData
      onbType: '',
      status: '',
      publicKey: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should handle error in template generation but still return SUCCESS', async () => {
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(testOnboardingStatus),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(of({}));
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));
      // This mock is for generateContractHtml, the first call to generateTemplate
      mockTemplateGeneratorService.generateTemplate.mockReturnValue(
        throwError(() => new Error('Template generation failed')),
      );
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        of({ status: 'SUCCESS', referenceTransaction: 'ref123' }),
      );
      mockMsaMcBoConfigurationService.getNodeConfigByCode.mockReturnValue(
        of({ configData: { principalContact: 'contact-123' } }),
      );

      const result = await service.signContract(testInput);

      expect(result.status).toBe('SUCCESS');
      expect(result.message).toBe(
        'The contract signature submission process completed successfully.',
      );
    });
  });

  describe('maskLastFourWithAsterisks', () => {
    it('should mask string longer than 4 chars', () => {
      expect((service as any).maskLastFourWithAsterisks('1234567890')).toBe(
        '******7890',
      );
    });
    it('should return only asterisks for string with length < 4', () => {
      expect((service as any).maskLastFourWithAsterisks('123')).toBe('******');
    });
    it('should return only asterisks for empty string', () => {
      expect((service as any).maskLastFourWithAsterisks('')).toBe('******');
    });
    it('should return only asterisks for null value', () => {
      expect((service as any).maskLastFourWithAsterisks(null)).toBe('******');
    });
    it('should return only asterisks for undefined value', () => {
      expect((service as any).maskLastFourWithAsterisks(undefined)).toBe(
        '******',
      );
    });
    it('should handle exactly 4 char string', () => {
      expect((service as any).maskLastFourWithAsterisks('1234')).toBe(
        '******1234',
      );
    });
  });

  describe('extractOnboardingData', () => {
    it('should correctly extract data from onboarding status', () => {
      const onboardingStatus: GetAllOnboardingResponseDto = {
        data: {
          'confirm-data': {
            data: {
              establishment: {
                numberEstablishment: '123',
              },
            },
          },
          'start-onb-cnb': {
            data: {
              email: 'test@example.com',
              fullName: 'Test Full Name Onboarding',
              ruc: {
                razonSocial: 'Test Business',
                tipoContribuyente: 'NATURAL',
                addit: [
                  {
                    numeroEstablecimiento: '123',
                    nombreFantasiaComercial: 'Test Store',
                    tipoEstablecimiento: 'COM',
                    direccionCompleta: 'Test Address',
                    estado: 'ACTIVO',
                    matriz: 'NO',
                  },
                ],
              },
            },
          },
        },
        id: 0,
        sessionId: '',
        securitySeed: '',
        identityId: '',
        onbType: '',
        status: '',
        publicKey: '',
        createdAt: undefined,
        updatedAt: undefined,
      };

      const result = (service as any).extractOnboardingData(onboardingStatus);

      expect(result).toEqual(
        expect.objectContaining({
          // Use expect.objectContaining for flexibility
          commercialName: 'Test Store',
          establishmentType: 'COM',
          fullAddress: 'Test Address',
          status: 'ACTIVO',
          establishmentNumber: '123',
          headquarters: false,
          typeClient: 'NATURAL',
          email: 'test@example.com',
          onboardingFullName: 'Test Full Name Onboarding',
        }),
      );
    });

    it('should fall back to razonSocial when no fantasy name is available and then to companyName', () => {
      const onboardingStatusNoFantasy: GetAllOnboardingResponseDto = {
        data: {
          'confirm-data': {
            data: { establishment: { numberEstablishment: '123' } },
          },
          'start-onb-cnb': {
            data: {
              email: 'test@example.com',
              fullName: 'Actual Full Name',
              companyName: 'Test Company Name From Attr', // Fallback for commercialName
              ruc: {
                razonSocial: 'Test Business RazonSocial', // Intermediate fallback
                tipoContribuyente: 'NATURAL',
                numeroRuc: '1234567890',
                addit: [
                  {
                    numeroEstablecimiento: '123',
                    // nombreFantasiaComercial: null, // No fantasy name
                    tipoEstablecimiento: 'COM',
                    direccionCompleta: 'Test Address',
                    estado: 'ACTIVO',
                    matriz: 'NO',
                  },
                ],
              },
            },
          },
        },
        id: 0,
        sessionId: '',
        securitySeed: '',
        identityId: '',
        onbType: '',
        status: '',
        publicKey: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = (service as any).extractOnboardingData(
        onboardingStatusNoFantasy,
      );
      // The logic is: establishmentAddit.nombreFantasiaComercial -> matrizAddit.nombreFantasiaComercial -> startOnbCnb.data.companyName
      // In this case, no addit has nombreFantasiaComercial, so it should use companyName.
      expect(result.commercialName).toBe('Test Company Name From Attr');
      expect(result.onboardingFullName).toBe('Actual Full Name');
    });
  });

  describe('buildErrorResponse', () => {
    it('should build error response with custom error code', () => {
      const error = {
        message: 'Test error',
        code: 'TEST_CODE',
      };

      const result = (service as any).buildErrorResponse(error);

      expect(result).toEqual({
        status: 'ERROR',
        message: 'Test error',
        errorCode: 'TEST_CODE',
        details: {
          getOtpDataResult: 'FAIL',
          errorMessage: 'Test error',
        },
      });
    });

    it('should use default error code when none provided', () => {
      const error = {
        message: 'Test error',
      };

      const result = (service as any).buildErrorResponse(error);

      expect(result.errorCode).toBe(ErrorCodes.AUTH_OTP_INVALID);
    });
  });
});
