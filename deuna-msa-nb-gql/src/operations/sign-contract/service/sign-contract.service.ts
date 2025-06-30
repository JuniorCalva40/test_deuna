import { Injectable, Inject, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { SignContractInput } from '../dto/sign-contract-input.dto';
import { SignContractResponse } from '../dto/sign-contract-response.dto';
import { MSA_CO_INVOICE_SERVICE } from '../../../external-services/msa-co-invoice/providers/msa-co-invoice.provider';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-client/providers/msa-nb-client-service.provider';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_TL_TEMPLATE_GENERATOR_SERVICE } from '../../../external-services/msa-tl-template-generator/providers/msa-tl-template-generator.provider';
import { MSA_CO_DOCUMENT_SERVICE } from '../../../external-services/msa-co-document/providers/msa-co-document.provider';
import { MSA_TL_NOTIFICATION_EMAIL_SERVICE } from '../../../external-services/msa-tl-notification-email/providers/msa-tl-notification-email.provider';
import { IMsaCoInvoiceService } from '../../../external-services/msa-co-invoice/interfaces/msa-co-invoice-service.interface';
import { IMsaNbClientService } from '../../../external-services/msa-nb-client/interfaces/msa-nb-client-service.interface';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { IMsaTlTemplateGeneratorService } from '../../../external-services/msa-tl-template-generator/interfaces/msa-tl-template-generator-service.interface';
import { IMsaCoDocumentService } from '../../../external-services/msa-co-document/interfaces/msa-co-document-service.interface';
import { IMsaTlNotificationEmailService } from '../../../external-services/msa-tl-notification-email/interfaces/msa-tl-notification-email-service.interface';
import { DataUpdateOnboardingSignContractInputDto } from '../../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-input.dto';

@Injectable()
export class SignContractService {
  private readonly logger = new Logger(SignContractService.name);

  constructor(
    @Inject(MSA_CO_INVOICE_SERVICE)
    private readonly msaCoInvoiceService: IMsaCoInvoiceService,
    @Inject(MSA_NB_CLIENT_SERVICE)
    private readonly msaNbClientService: IMsaNbClientService,
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStatusService: IMsaCoOnboardingStatusService,
    @Inject(MSA_TL_TEMPLATE_GENERATOR_SERVICE)
    private readonly msaTlTemplateGeneratorService: IMsaTlTemplateGeneratorService,
    @Inject(MSA_CO_DOCUMENT_SERVICE)
    private readonly msaCoDocumentService: IMsaCoDocumentService,
    @Inject(MSA_TL_NOTIFICATION_EMAIL_SERVICE)
    private readonly msaTlNotificationEmailService: IMsaTlNotificationEmailService,
  ) {}

  async signContract(input: SignContractInput): Promise<SignContractResponse> {
    const steps = {
      getClientData: 'PENDING',
      getOtpData: 'PENDING',
      updateOnboardingState: 'PENDING',
      createInvoiceAccount: 'PENDING',
      updateClientStatus: 'PENDING',
      generateContractHtml: 'PENDING',
      createContractDocument: 'PENDING',
      sendContractEmail: 'PENDING',
    };

    try {
      // Get client data from onboarding state
      steps.getClientData = 'FAIL';
      const clientData = await lastValueFrom(
        this.msaCoOnboardingStatusService.getClientDataFromStartOnboardingState(
          input.sessionId,
        ),
      );
      steps.getClientData = 'SUCCESS';

      // Get OTP data from validate-otp state
      steps.getOtpData = 'FAIL';
      const otpData = await lastValueFrom(
        this.msaCoOnboardingStatusService.getOtpDataFromValidateOtpState(
          input.sessionId,
        ),
      );
      const otp = otpData.otp;
      steps.getOtpData = 'SUCCESS';

      // Generate contract HTML
      steps.generateContractHtml = 'FAIL';
      const contractHtml = await this.generateContractHtml(
        clientData,
        otp,
        input.sessionId,
      );
      steps.generateContractHtml = 'SUCCESS';

      // Create contract document
      steps.createContractDocument = 'FAIL';
      const documentResult = await this.createContractDocument(
        clientData.cnbClientId,
        clientData.identityId,
        contractHtml,
      );
      steps.createContractDocument = 'SUCCESS';

      // Create invoice account
      steps.createInvoiceAccount = 'FAIL';
      await this.createInvoiceAccount(clientData);
      steps.createInvoiceAccount = 'SUCCESS';

      // Update client status
      steps.updateClientStatus = 'FAIL';
      await this.updateClientStatus(clientData.cnbClientId);
      steps.updateClientStatus = 'SUCCESS';

      // Update onboarding state
      steps.updateOnboardingState = 'FAIL';
      await this.updateOnboardingState(input.sessionId);
      steps.updateOnboardingState = 'SUCCESS';

      // Send contract email
      steps.sendContractEmail = 'FAIL';
      await this.sendContractEmail(clientData.email, documentResult);
      steps.sendContractEmail = 'SUCCESS';

      return {
        status: 'SUCCESS',
        message: 'Contract signed successfully',
        details: {
          getClientDataResult: steps.getClientData,
          updateOnboardingStateResult: steps.updateOnboardingState,
          generateContractHtmlResult: steps.generateContractHtml,
          createContractDocumentResult: steps.createContractDocument,
          invoiceAccountResult: steps.createInvoiceAccount,
          clientStatusUpdateResult: steps.updateClientStatus,
          sendContractEmailResult: steps.sendContractEmail,
          getOtpDataResult: steps.getOtpData,
        },
      };
    } catch (error) {
      this.logger.error('Error in sign contract process:', error.message);
      const errorDetails = this.getErrorDetails(steps);
      return {
        status: 'ERROR',
        message: errorDetails.message,
        errorCode: errorDetails.errorCode,
        details: {
          remainingVerifyAttempts: error.remainingVerifyAttempts,
          getClientDataResult: steps.getClientData,
          updateOnboardingStateResult: steps.updateOnboardingState,
          generateContractHtmlResult: steps.generateContractHtml,
          createContractDocumentResult: steps.createContractDocument,
          invoiceAccountResult: steps.createInvoiceAccount,
          clientStatusUpdateResult: steps.updateClientStatus,
          sendContractEmailResult: steps.sendContractEmail,
          getOtpDataResult: steps.getOtpData,
          errorMessage: error.message,
        },
      };
    }
  }

  private getErrorDetails(steps: any): { message: string; errorCode: string } {
    if (steps.getClientData === 'FAIL') {
      return {
        message: 'Failed to retrieve client data',
        errorCode: 'ERR_CLIENT_DATA',
      };
    }
    if (steps.validateOtp === 'FAIL') {
      return {
        message: 'OTP validation failed',
        errorCode: 'ERR_OTP_VALIDATION',
      };
    }
    if (steps.updateOnboardingState === 'FAIL') {
      return {
        message: 'Failed to update onboarding state',
        errorCode: 'ERR_ONBOARDING_STATE',
      };
    }
    if (steps.generateContractHtml === 'FAIL') {
      return {
        message: 'Failed to generate contract HTML',
        errorCode: 'ERR_CONTRACT_HTML',
      };
    }
    if (steps.createContractDocument === 'FAIL') {
      return {
        message: 'Failed to create contract document',
        errorCode: 'ERR_CONTRACT_DOCUMENT',
      };
    }
    if (steps.createInvoiceAccount === 'FAIL') {
      return {
        message: 'Failed to create invoice account',
        errorCode: 'ERR_INVOICE_ACCOUNT',
      };
    }
    if (steps.updateClientStatus === 'FAIL') {
      return {
        message: 'Failed to update client status',
        errorCode: 'ERR_CLIENT_STATUS',
      };
    }
    if (steps.sendContractEmail === 'FAIL') {
      return {
        message: 'Failed to send contract email',
        errorCode: 'ERR_CONTRACT_EMAIL',
      };
    }
    return {
      message: 'An unexpected error occurred during contract signing',
      errorCode: 'ERR_UNKNOWN',
    };
  }

  private async updateOnboardingState(sessionId: string): Promise<void> {
    try {
      // First update the sign-contract state
      const updateData: DataUpdateOnboardingSignContractInputDto = {
        status: 'SUCCESS',
      };

      await lastValueFrom(
        this.msaCoOnboardingStatusService.updateOnboardingState(
          {
            sessionId: sessionId,
            status: 'SUCCESS',
            data: updateData,
          },
          'sign-contract',
        ),
      );

      // Then complete the onboarding process
      await lastValueFrom(
        this.msaCoOnboardingStatusService.completeOnboarding(sessionId),
      );
    } catch (error) {
      this.logger.error(
        `Failed to update onboarding state: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async generateContractHtml(
    clientData: any,
    otp: string,
    sessionId: string,
  ): Promise<string> {
    const templateData = {
      templateName: 'electronic_business_relationship_contract',
      templatePath:
        'onboarding/documents/electronic_business_relationship_contract.html',
      dynamicData: {
        fullName: clientData.legalRepresentative,
        otp: otp.toString(),
        identification: clientData.identityId,
        email: clientData.email,
      },
    };

    const result = await lastValueFrom(
      this.msaTlTemplateGeneratorService.generateTemplate(templateData, {
        trackingId: sessionId,
      }),
    );

    if (!result.generatedHtml || result.generatedHtml.length === 0) {
      throw new Error('Failed to generate contract HTML');
    }

    return result.generatedHtml[0];
  }

  private async createContractDocument(
    commerceId: string,
    identification: string,
    htmlTemplate: string,
  ): Promise<any> {
    const documentData = {
      commerceId: commerceId,
      htmlTemplate: htmlTemplate,
      description: 'Contrato CNB',
      identification: identification,
      fileName: 'cnb-contract',
      processName: 'onboarding',
      mimeType: 'application/pdf',
      extension: 'pdf',
      tags: ['contract'],
    };

    return lastValueFrom(
      this.msaCoDocumentService.generateDocument(documentData),
    );
  }

  private async createInvoiceAccount(clientData: any): Promise<void> {
    const accountData = {
      provider: 'INTUITO',
      ruc: clientData.ruc,
      legal_name: clientData.legalRepresentative,
      address: clientData.businessAddress,
      telephone: '344433223', // This should be obtained from clientData
      email: clientData.email,
      category: 'EMPRENDEDOR',
      economic_activities: 'Materiales, Herramientas y Equipo',
      entity_type: 'Sociedad Anónima',
      location: {
        code: '001',
        city: 'Guayaquil',
        province: 'EC-G',
        address: clientData.establishment.fullAdress,
        points_of_sale_code: clientData.establishment.numberEstablishment,
        points_of_sale_description: 'Cnb DeUna',
      },
    };
    await lastValueFrom(this.msaCoInvoiceService.createAccount(accountData));
  }

  private async updateClientStatus(clientId: string): Promise<void> {
    await lastValueFrom(
      this.msaNbClientService.updateClientStatus(clientId, 'ACTIVO'),
    );
  }

  private async sendContractEmail(
    email: string,
    documentResult: any,
  ): Promise<void> {
    const emailNotification = {
      to: [email],
      subject: 'Tu Contrato CNB',
      body: '<html><body><h1>Contrato CNB</h1><p>Adjunto encontrarás tu contrato CNB firmado.</p></body></html>',
      attachments: [
        {
          fileName: documentResult.data[0].fileName,
          contentType: 'application/pdf',
          url: documentResult.data[0].signedUrl,
        },
      ],
    };

    await lastValueFrom(
      this.msaTlNotificationEmailService.sendEmail(emailNotification),
    );
  }
}
