import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { SignContractService } from './sign-contract.service';
import { SignContractInput } from '../dto/sign-contract-input.dto';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { MSA_CO_INVOICE_SERVICE } from '../../../external-services/msa-co-invoice/providers/msa-co-invoice.provider';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-client/providers/msa-nb-client-service.provider';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_TL_TEMPLATE_GENERATOR_SERVICE } from '../../../external-services/msa-tl-template-generator/providers/msa-tl-template-generator.provider';
import { MSA_CO_DOCUMENT_SERVICE } from '../../../external-services/msa-co-document/providers/msa-co-document.provider';
import { MSA_TL_NOTIFICATION_EMAIL_SERVICE } from '../../../external-services/msa-tl-notification-email/providers/msa-tl-notification-email.provider';

describe('SignContractService', () => {
  let service: SignContractService;
  let mockAuthService: any;
  let mockInvoiceService: any;
  let mockClientService: any;
  let mockOnboardingService: any;
  let mockTemplateService: any;
  let mockDocumentService: any;
  let mockEmailService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignContractService,
        { provide: MSA_CO_AUTH_SERVICE, useValue: { validateOtp: jest.fn() } },
        {
          provide: MSA_CO_INVOICE_SERVICE,
          useValue: { createAccount: jest.fn() },
        },
        {
          provide: MSA_NB_CLIENT_SERVICE,
          useValue: { updateClientStatus: jest.fn() },
        },
        {
          provide: MSA_CO_ONBOARDING_STATE_SERVICE,
          useValue: {
            getClientDataFromStartOnboardingState: jest.fn(),
            updateOnboardingState: jest.fn(),
            completeOnboarding: jest.fn(),
            getOtpDataFromValidateOtpState: jest.fn(),
          },
        },
        {
          provide: MSA_TL_TEMPLATE_GENERATOR_SERVICE,
          useValue: { generateTemplate: jest.fn() },
        },
        {
          provide: MSA_CO_DOCUMENT_SERVICE,
          useValue: { generateDocument: jest.fn() },
        },
        {
          provide: MSA_TL_NOTIFICATION_EMAIL_SERVICE,
          useValue: { sendEmail: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SignContractService>(SignContractService);
    mockAuthService = module.get(MSA_CO_AUTH_SERVICE);
    mockInvoiceService = module.get(MSA_CO_INVOICE_SERVICE);
    mockClientService = module.get(MSA_NB_CLIENT_SERVICE);
    mockOnboardingService = module.get(MSA_CO_ONBOARDING_STATE_SERVICE);
    mockTemplateService = module.get(MSA_TL_TEMPLATE_GENERATOR_SERVICE);
    mockDocumentService = module.get(MSA_CO_DOCUMENT_SERVICE);
    mockEmailService = module.get(MSA_TL_NOTIFICATION_EMAIL_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signContract', () => {
    const mockInput: SignContractInput = {
      sessionId: 'test-session-id',
    };

    const mockClientData = {
      cnbClientId: 'test-cnb-client-id',
      email: 'test@example.com',
      legalRepresentative: 'Test User',
      identityId: 'test-identity-id',
      ruc: '1234567890',
      businessAddress: 'Test Address',
      establishment: {
        fullAdress: 'Test Full Address',
        numberEstablishment: '123',
      },
    };

    it('should successfully sign contract', async () => {
      //mockAuthService.validateOtp.mockReturnValue(of({ status: 'SUCCESS' }));
      mockOnboardingService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));
      mockTemplateService.generateTemplate.mockReturnValue(
        of({ generatedHtml: ['<html>Test</html>'] }),
      );
      mockDocumentService.generateDocument.mockReturnValue(
        of({ data: [{ signedUrl: 'test-url', fileName: 'test-file' }] }),
      );
      mockInvoiceService.createAccount.mockReturnValue(of({}));
      mockClientService.updateClientStatus.mockReturnValue(of({}));
      mockEmailService.sendEmail.mockReturnValue(of({}));

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('SUCCESS');
      expect(result.message).toBe('Contract signed successfully');
    });

    it('should handle client data retrieval failure', async () => {
      mockOnboardingService.getClientDataFromStartOnboardingState.mockReturnValue(
        throwError(() => new Error('Failed to retrieve client data')),
      );

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Failed to retrieve client data');
      expect(result.details.getClientDataResult).toBe('FAIL');
    });

    it('should handle errors in contract HTML generation', async () => {
      mockAuthService.validateOtp.mockReturnValue(of({ status: 'SUCCESS' }));
      mockOnboardingService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockTemplateService.generateTemplate.mockReturnValue(
        throwError(() => new Error('HTML generation failed')),
      );

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Failed to generate contract HTML');
      expect(result.details.generateContractHtmlResult).toBe('FAIL');
    });

    it('should handle errors in contract document creation', async () => {
      mockAuthService.validateOtp.mockReturnValue(of({ status: 'SUCCESS' }));
      mockOnboardingService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockTemplateService.generateTemplate.mockReturnValue(
        of({ generatedHtml: ['<html>Test</html>'] }),
      );
      mockDocumentService.generateDocument.mockReturnValue(
        throwError(() => new Error('Document creation failed')),
      );

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Failed to create contract document');
      expect(result.details.createContractDocumentResult).toBe('FAIL');
    });

    it('should handle errors in invoice account creation', async () => {
      mockAuthService.validateOtp.mockReturnValue(of({ status: 'SUCCESS' }));
      mockOnboardingService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockTemplateService.generateTemplate.mockReturnValue(
        of({ generatedHtml: ['<html>Test</html>'] }),
      );
      mockDocumentService.generateDocument.mockReturnValue(
        of({ data: [{ signedUrl: 'test-url', fileName: 'test-file' }] }),
      );
      mockInvoiceService.createAccount.mockReturnValue(
        throwError(() => new Error('Invoice account creation failed')),
      );

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Failed to create invoice account');
      expect(result.details.invoiceAccountResult).toBe('FAIL');
    });

    it('should handle errors in client status update', async () => {
      mockAuthService.validateOtp.mockReturnValue(of({ status: 'SUCCESS' }));
      mockOnboardingService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockTemplateService.generateTemplate.mockReturnValue(
        of({ generatedHtml: ['<html>Test</html>'] }),
      );
      mockDocumentService.generateDocument.mockReturnValue(
        of({ data: [{ signedUrl: 'test-url', fileName: 'test-file' }] }),
      );
      mockInvoiceService.createAccount.mockReturnValue(of({}));
      mockClientService.updateClientStatus.mockReturnValue(
        throwError(() => new Error('Client status update failed')),
      );

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Failed to update client status');
      expect(result.details.clientStatusUpdateResult).toBe('FAIL');
    });

    it('should handle errors in contract email sending', async () => {
      mockAuthService.validateOtp.mockReturnValue(of({ status: 'SUCCESS' }));
      mockOnboardingService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockTemplateService.generateTemplate.mockReturnValue(
        of({ generatedHtml: ['<html>Test</html>'] }),
      );
      mockDocumentService.generateDocument.mockReturnValue(
        of({ data: [{ signedUrl: 'test-url', fileName: 'test-file' }] }),
      );
      mockInvoiceService.createAccount.mockReturnValue(of({}));
      mockClientService.updateClientStatus.mockReturnValue(of({}));
      mockEmailService.sendEmail.mockReturnValue(
        throwError(() => new Error('Email sending failed')),
      );
      mockOnboardingService.completeOnboarding.mockReturnValue(of({}));

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Failed to send contract email');
      expect(result.details.sendContractEmailResult).toBe('FAIL');
    });

    it('should handle empty generated HTML', async () => {
      mockAuthService.validateOtp.mockReturnValue(of({ status: 'SUCCESS' }));
      mockOnboardingService.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );
      mockOnboardingService.getOtpDataFromValidateOtpState.mockReturnValue(
        of({ otp: '123456' }),
      );
      mockOnboardingService.updateOnboardingState.mockReturnValue(of({}));
      mockTemplateService.generateTemplate.mockReturnValue(
        of({ generatedHtml: [] }), // Devuelve un array vacío
      );

      const result = await service.signContract(mockInput);

      expect(result.status).toBe('ERROR');
      expect(result.message).toBe('Failed to generate contract HTML');
      expect(result.details.generateContractHtmlResult).toBe('FAIL');
    });
  });
});
