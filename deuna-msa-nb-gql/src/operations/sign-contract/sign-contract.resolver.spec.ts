import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { Logger } from '@deuna/tl-logger-nd';
import { SignContractService } from './service/sign-contract.service';
import { SignContractInput } from './dto/sign-contract-input.dto';
import { GetAllOnboardingResponseDto } from '../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_NB_CNB_ORQ_SERVICE } from '../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { MSA_TL_TEMPLATE_GENERATOR_SERVICE } from '../../external-services/msa-tl-template-generator/providers/msa-tl-template-generator.provider';
import { MSA_TL_NOTIFICATION_EMAIL_SERVICE } from '../../external-services/msa-tl-notification-email/providers/msa-tl-notification-email.provider';
import { MSA_MC_BO_CONFIGURATION_SERVICE } from '../../external-services/msa-mc-bo-configuration/providers/msa-mc-bo-configuration.provider';
import { ErrorCodes } from '../../common/constants/error-codes';

// Mock the logger
jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  })),
}));

describe('SignContractService', () => {
  let service: SignContractService;
  let mockOnboardingService: any;
  let mockCnbOrqService: any;
  let mockTemplateGeneratorService: any;
  let mockNotificationService: any;
  let mockConfigurationService: any;

  // Mock data
  const mockInput: SignContractInput = {
    sessionId: 'test-session-id',
    onboardingSessionId: 'test-onboarding-session-id',
    trackingId: 'test-tracking-id',
    requestId: 'test-request-id',
    nodeId: 'test-node-id',
    latitude: '0',
    longitude: '0',
    clientCnbDocumentId: '1721529707001',
    merchantId: 'test-merchant-id',
    clientAccountId: 'test-client-account-id',
  };

  const getMockOnboardingStatus = (): GetAllOnboardingResponseDto => ({
    id: 1,
    sessionId: 'test-onboarding-session-id',
    securitySeed: 'test-seed',
    identityId: '1721529707001',
    onbType: 'CNB',
    status: 'COMPLETED',
    publicKey: 'test-public-key',
    createdAt: new Date(),
    updatedAt: new Date(),
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
          fullName: 'Test User FullName',
          companyName: 'Test Business From CompanyName',
          ruc: {
            razonSocial: 'Test Business',
            tipoContribuyente: 'NATURAL',
            rucNumber: '1721529707001',
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
  });

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
            startElectronicSignatureProcess: jest.fn(),
            notifyOnboardingFinish: jest.fn(),
            generateDocument: jest.fn(),
          },
        },
        {
          provide: MSA_TL_TEMPLATE_GENERATOR_SERVICE,
          useValue: {
            generateTemplate: jest.fn(),
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
    mockTemplateGeneratorService = module.get(MSA_TL_TEMPLATE_GENERATOR_SERVICE);
    mockNotificationService = module.get(MSA_TL_NOTIFICATION_EMAIL_SERVICE);
    mockConfigurationService = module.get(MSA_MC_BO_CONFIGURATION_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Happy Path', () => {
    it('should successfully sign a contract when all services work correctly', async () => {
      // Arrange
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(getMockOnboardingStatus()),
      );
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        of({ status: 'SUCCESS', referenceTransaction: 'ref123' }),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(of({}));
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));
      mockConfigurationService.getNodeConfigByCode.mockReturnValue(
        of({ configData: { principalContact: 'contact@deuna.com' } }),
      );
      mockTemplateGeneratorService.generateTemplate.mockImplementation(
        ({ templateName }) => {
          if (templateName.includes('subject')) {
            return of({ generatedHtml: ['Email Subject'] });
          }
          return of({ generatedHtml: [`<html>${templateName}</html>`] });
        },
      );
      mockCnbOrqService.generateDocument.mockImplementation(({ fileName }) =>
        of({
          status: 'success',
          data: [{ signedUrl: `http://url/${fileName}.pdf`, fileName }],
        }),
      );
      mockNotificationService.sendEmail.mockReturnValue(of({}));

      // Act
      const result = await service.signContract(mockInput);

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(result.message).toContain('completed successfully');
      expect(
        mockOnboardingService.getOtpDataFromValidateOtpState,
      ).toHaveBeenCalledWith(mockInput.onboardingSessionId);
      expect(
        mockCnbOrqService.startElectronicSignatureProcess,
      ).toHaveBeenCalled();
      expect(mockCnbOrqService.notifyOnboardingFinish).toHaveBeenCalled();
      expect(mockOnboardingService.updateOnboardingState).toHaveBeenCalled();
      expect(mockOnboardingService.completeOnboarding).toHaveBeenCalled();
      expect(mockCnbOrqService.generateDocument).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should return an error if getOtpData fails', async () => {
      // Arrange
      const error = new Error('OTP retrieval failed');
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        throwError(() => error),
      );

      // Act
      const result = await service.signContract(mockInput);

      // Assert
      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('OTP retrieval failed');
      expect(result.errorCode).toBe(ErrorCodes.AUTH_OTP_INVALID);
    });

    it('should return an error if getCompleteOnboardingStatus fails', async () => {
      // Arrange
      const error = new Error('Onboarding status retrieval failed');
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        throwError(() => error),
      );

      // Act
      const result = await service.signContract(mockInput);

      // Assert
      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Onboarding status retrieval failed');
    });

    it('should continue and succeed if electronic signature fails', async () => {
      // Arrange
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(getMockOnboardingStatus()),
      );
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        throwError(() => new Error('Signature service unavailable')),
      );
      // Mock the rest of the flow to succeed
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(of({}));
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));
      mockConfigurationService.getNodeConfigByCode.mockReturnValue(
        of({ configData: { principalContact: 'contact@deuna.com' } }),
      );
      mockTemplateGeneratorService.generateTemplate.mockReturnValue(
        of({ generatedHtml: ['<html></html>'] }),
      );
      mockCnbOrqService.generateDocument.mockReturnValue(
        of({
          status: 'success',
          data: [{ signedUrl: 'http://url.com', fileName: 'doc.pdf' }],
        }),
      );
      mockNotificationService.sendEmail.mockReturnValue(of({}));

      // Act
      const result = await service.signContract(mockInput);

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(mockCnbOrqService.notifyOnboardingFinish).toHaveBeenCalledWith(
        expect.objectContaining({ referenceTransaction: undefined }),
        expect.anything(),
      );
    });

    it('should return an error if notifyOnboardingFinish fails', async () => {
      // Arrange
      const error = new Error('Notification service failed');
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(getMockOnboardingStatus()),
      );
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        of({ status: 'SUCCESS', referenceTransaction: 'ref123' }),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(
        throwError(() => error),
      );

      // Act
      const result = await service.signContract(mockInput);

      // Assert
      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Notification service failed');
    });

    it('should return an error if updateOnboardingState fails', async () => {
      // Arrange
      const error = new Error('Failed to update onboarding state');
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(getMockOnboardingStatus()),
      );
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        of({ status: 'SUCCESS', referenceTransaction: 'ref123' }),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(of({}));
      mockOnboardingService.updateOnboardingState.mockReturnValue(
        throwError(() => error),
      );

      // Act
      const result = await service.signContract(mockInput);

      // Assert
      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Failed to update onboarding state');
      expect(result.errorCode).toBe(ErrorCodes.ONB_STATUS_INVALID);
    });

    it('should succeed even if contract document generation fails', async () => {
      // Arrange
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(getMockOnboardingStatus()),
      );
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        of({ status: 'SUCCESS', referenceTransaction: 'ref123' }),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(of({}));
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));
      mockConfigurationService.getNodeConfigByCode.mockReturnValue(
        of({ configData: { principalContact: 'contact@deuna.com' } }),
      );
      mockTemplateGeneratorService.generateTemplate.mockReturnValue(
        throwError(() => new Error('Template service error')),
      );

      // Act
      const result = await service.signContract(mockInput);

      // Assert
      expect(result.status).toBe('SUCCESS');
      expect(mockCnbOrqService.generateDocument).not.toHaveBeenCalled();
      expect(mockNotificationService.sendEmail).not.toHaveBeenCalled();
    });

    it('should succeed even if email notification fails', async () => {
      // Arrange
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(getMockOnboardingStatus()),
      );
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        of({ status: 'SUCCESS', referenceTransaction: 'ref123' }),
      );
      mockCnbOrqService.notifyOnboardingFinish.mockReturnValue(of({}));
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));
      mockConfigurationService.getNodeConfigByCode.mockReturnValue(
        of({ configData: { principalContact: 'contact@deuna.com' } }),
      );
      mockTemplateGeneratorService.generateTemplate.mockReturnValue(
        of({ generatedHtml: ['<html></html>'] }),
      );
      mockCnbOrqService.generateDocument.mockReturnValue(
        of({
          status: 'success',
          data: [{ signedUrl: 'http://url.com', fileName: 'doc.pdf' }],
        }),
      );
      mockNotificationService.sendEmail.mockReturnValue(
        throwError(() => new Error('Email service down')),
      );

      // Act
      const result = await service.signContract(mockInput);

      // Assert
      expect(result.status).toBe('SUCCESS');
    });
  });

  describe('Data Validation', () => {
    it('should return an error if required onboarding data is missing', async () => {
      // Arrange
      const mockIncompleteStatus = getMockOnboardingStatus();
      delete mockIncompleteStatus.data['start-onb-cnb']; // Remove critical data
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.getCompleteOnboardingStatus.mockReturnValue(
        of(mockIncompleteStatus),
      );
      mockCnbOrqService.startElectronicSignatureProcess.mockReturnValue(
        of({ status: 'SUCCESS', referenceTransaction: 'ref123' }),
      );

      // Act
      const result = await service.signContract(mockInput);

      // Assert
      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Required onboarding data not found');
    });
  });
});
