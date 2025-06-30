import { Injectable, Inject } from '@nestjs/common';
import { lastValueFrom, map } from 'rxjs';
import { SignContractInput } from '../dto/sign-contract-input.dto';
import { SignContractResponse } from '../dto/sign-contract-response.dto';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { Logger } from '@deuna/tl-logger-nd';
import { formatLogger } from '../../../utils/format-logger';
import {
  IMsaNbCnbOrqService,
  MSA_NB_CNB_ORQ_SERVICE,
} from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { GetAllOnboardingResponseDto } from '../../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { MSA_TL_TEMPLATE_GENERATOR_SERVICE } from '../../../external-services/msa-tl-template-generator/providers/msa-tl-template-generator.provider';
import { MSA_TL_NOTIFICATION_EMAIL_SERVICE } from '../../../external-services/msa-tl-notification-email/providers/msa-tl-notification-email.provider';
import { IMsaTlTemplateGeneratorService } from '../../../external-services/msa-tl-template-generator/interfaces/msa-tl-template-generator-service.interface';
import { IMsaTlNotificationEmailService } from '../../../external-services/msa-tl-notification-email/interfaces/msa-tl-notification-email-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { IMsaMcBoConfigurationService } from '../../../external-services/msa-mc-bo-configuration/interfaces/msa-mc-bo-configuration-service.interface'; // Añadido
import { MSA_MC_BO_CONFIGURATION_SERVICE } from '../../../external-services/msa-mc-bo-configuration/providers/msa-mc-bo-configuration.provider'; // Añadido
import { toTitleCase } from '../../../utils/string.util';

export interface RequestContext {
  sessionId: string;
  trackingId: string;
  requestId: string;
}

export interface ClientDataContext {
  commercialName: string;
  identityId: string;
  email: string;
  principalContact: string;
}

export interface TemplateDetails {
  name: string;
  path: string;
}

export interface DocumentCreationContext {
  merchantId: string;
  identityId: string;
}

export interface DocumentOutputParams {
  description: string;
  fileName: string;
}

interface ContractEmailContext {
  nodeId: string;
  onboardingIdentityId: string;
  onboardingFullName?: string;
  clientAccountId?: string;
  commercialName: string;
  email: string;
  principalContact: string;
}

@Injectable()
export class SignContractService {
  private readonly logger = new Logger({
    context: SignContractService.name,
  });

  constructor(
    @Inject(MSA_CO_ONBOARDING_STATE_SERVICE)
    private readonly msaCoOnboardingStatusService: IMsaCoOnboardingStatusService,
    @Inject(MSA_NB_CNB_ORQ_SERVICE)
    private readonly msaNbCnbOrqService: IMsaNbCnbOrqService,
    @Inject(MSA_TL_TEMPLATE_GENERATOR_SERVICE)
    private readonly msaTlTemplateGeneratorService: IMsaTlTemplateGeneratorService,
    @Inject(MSA_TL_NOTIFICATION_EMAIL_SERVICE)
    private readonly msaTlNotificationEmailService: IMsaTlNotificationEmailService,
    @Inject(MSA_MC_BO_CONFIGURATION_SERVICE)
    private readonly msaMcBoConfigurationService: IMsaMcBoConfigurationService,
  ) {}

  private maskLastFourWithAsterisks(value: string | undefined | null): string {
    const asterisks = '******';
    if (typeof value === 'string' && value.length >= 4) {
      return asterisks + value.slice(-4);
    }
    return asterisks; // Devuelve '******' si no es string, es null/undefined, o longitud < 4
  }

  async signContract(input: SignContractInput): Promise<SignContractResponse> {
    try {
      formatLogger(
        this.logger,
        'info',
        'Starting sign contract process',
        input.sessionId,
        input.trackingId,
        input.requestId,
      );

      formatLogger(
        this.logger,
        'info',
        `SignContract input data: ${JSON.stringify(input)}`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );

      // Get OTP data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const otpData = await this.getOtpData(
        input.onboardingSessionId,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );

      const onboardingStatus = await lastValueFrom(
        this.msaCoOnboardingStatusService.getCompleteOnboardingStatus(
          input.onboardingSessionId,
        ),
      );

      let referenceTransaction: string;
      // Start electronic signature process
      try {
        const response = await lastValueFrom(
          this.msaNbCnbOrqService
            .startElectronicSignatureProcess(input.clientCnbDocumentId, {
              sessionId: input.sessionId,
              trackingId: input.trackingId,
              requestId: input.requestId,
            })
            .pipe(
              map((response) => {
                formatLogger(
                  this.logger,
                  'info',
                  `Electronic signature process response with reference transaction: ${response.referenceTransaction}`,
                  input.sessionId,
                  input.trackingId,
                  input.requestId,
                );
                return response;
              }),
            ),
        );

        if (response.referenceTransaction) {
          referenceTransaction = response.referenceTransaction;
        }
      } catch (error) {
        formatLogger(
          this.logger,
          'error',
          `Error in electronic signature process: ${error}. Process will continue.`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
      }

      // Extract required data from onboarding status
      const {
        commercialName,
        establishmentType,
        fullAddress,
        status,
        establishmentNumber,
        headquarters,
        typeClient,
        identityId,
        email,
        onboardingFullName,
      } = this.extractOnboardingData(onboardingStatus);

      // Notify onboarding finish
      await lastValueFrom(
        this.msaNbCnbOrqService.notifyOnboardingFinish(
          {
            commercialName,
            establishmentType,
            fullAddress,
            status,
            establishmentNumber,
            headquarters,
            nodeId: input.nodeId,
            typeClient,
            latitude: input.latitude,
            longitude: input.longitude,
            referenceTransaction: referenceTransaction,
          },
          {
            sessionId: input.sessionId,
            trackingId: input.trackingId,
            requestId: input.requestId,
          },
        ),
      );

      // Update onboarding state
      await this.updateOnboardingState(
        input.onboardingSessionId,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );

      try {
        // Get principalContact
        const principalContact = await this.getPrincipalContact(
          { nodeId: input.nodeId },
          input.sessionId,
          input.trackingId,
          input.requestId,
        );

        const clientDataContext: ClientDataContext = {
          commercialName,
          identityId: input.clientCnbDocumentId,
          email,
          principalContact,
        };

        const requestContext: RequestContext = {
          sessionId: input.sessionId,
          trackingId: input.trackingId,
          requestId: input.requestId,
        };

        const documentCreationContext: DocumentCreationContext = {
          merchantId: input.merchantId,
          identityId: identityId,
        };

        // Generate and create contract documents in parallel
        const [documentResult, billingDocumentResult] = await Promise.all([
          this.processContractDocumentCreation(
            clientDataContext,
            otpData.otp,
            requestContext,
            documentCreationContext,
            {
              name: 'electronic_service_contract',
              path: 'cnb/documents/electronic_service_contract.html',
            },
            { description: 'Contrato CNB', fileName: 'cnb-contract' },
          ),
          this.processContractDocumentCreation(
            clientDataContext,
            otpData.otp,
            requestContext,
            documentCreationContext,
            {
              name: 'billing_signing_service_contract',
              path: 'cnb/documents/billing_signing_service_contract.html',
            },
            {
              description: 'Contrato de Servicio de Facturación CNB',
              fileName: 'cnb-billing-contract',
            },
          ),
        ]);

        const contractEmailCtx: ContractEmailContext = {
          nodeId: input.nodeId,
          onboardingIdentityId: input.clientCnbDocumentId,
          onboardingFullName: onboardingFullName,
          clientAccountId: input.clientAccountId,
          commercialName: commercialName,
          email: email,
          principalContact: principalContact,
        };

        // Send contract email
        await this.sendContractEmail(
          email, // toEmail
          documentResult,
          billingDocumentResult, // Added billingDocumentResult
          contractEmailCtx,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
      } catch (error) {
        formatLogger(
          this.logger,
          'info',
          `Error generating contract document: ${error}`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
      }

      return {
        status: 'SUCCESS',
        message:
          'The contract signature submission process completed successfully.',
        details: {
          getOtpDataResult: 'SUCCESS',
        },
      };
    } catch (error) {
      return this.buildErrorResponse(error);
    }
  }

  private async getOtpData(
    onboardingSessionId: string,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ) {
    formatLogger(
      this.logger,
      'info',
      'Starting get otp data from msa-co-onboarding-status',
      sessionId,
      trackingId,
      requestId,
    );

    const otpData = await lastValueFrom(
      this.msaCoOnboardingStatusService.getOtpDataFromValidateOtpState(
        onboardingSessionId,
      ),
    );

    formatLogger(
      this.logger,
      'info',
      'Finished get otp data from msa-co-onboarding-status',
      sessionId,
      trackingId,
      requestId,
    );

    return otpData;
  }

  private async getPrincipalContact(
    context: { nodeId: string }, // Simplified context for this specific need
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<string> {
    let principalContactFromApi = '';
    if (context.nodeId) {
      try {
        const configResponse = await lastValueFrom(
          this.msaMcBoConfigurationService.getNodeConfigByCode(
            context.nodeId,
            'CO001',
          ),
        );
        if (configResponse?.configData?.principalContact) {
          principalContactFromApi = configResponse.configData
            .principalContact as string;
        } else {
          formatLogger(
            this.logger,
            'warn',
            `principalContact not found in CO001 config for nodeId ${context.nodeId}`,
            sessionId,
            trackingId,
            requestId,
          );
        }
      } catch (e) {
        formatLogger(
          this.logger,
          'warn',
          `Could not fetch principalContact (CO001) for nodeId ${context.nodeId}: ${e.message}`,
          sessionId,
          trackingId,
          requestId,
        );
      }
    }
    return principalContactFromApi;
  }

  private async updateOnboardingState(
    onboardingSessionId: string,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<void> {
    try {
      formatLogger(
        this.logger,
        'info',
        `Updating onboarding state for session: ${onboardingSessionId}`,
        sessionId,
        trackingId,
        requestId,
      );

      // First update the sign-contract state
      await lastValueFrom(
        this.msaCoOnboardingStatusService.updateOnboardingState(
          {
            sessionId: onboardingSessionId,
            status: 'SUCCESS',
            data: { status: 'SUCCESS' },
          },
          'sign-contract',
        ),
      );

      // Then complete the onboarding process
      await lastValueFrom(
        this.msaCoOnboardingStatusService.completeOnboarding(
          onboardingSessionId,
        ),
      );

      formatLogger(
        this.logger,
        'info',
        `Onboarding state updated successfully for session: ${onboardingSessionId}`,
        sessionId,
        trackingId,
        requestId,
      );
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Failed to update onboarding state: ${error.message}`,
        sessionId,
        trackingId,
        requestId,
      );
      const err = new Error('Failed to update onboarding state');
      (err as any).code = ErrorCodes.ONB_STATUS_INVALID;
      (err as any).details = error;
      throw err;
    }
  }

  private async processContractDocumentCreation(
    clientData: ClientDataContext,
    otp: string,
    requestContext: RequestContext,
    docCreationContext: DocumentCreationContext,
    templateDetails: TemplateDetails,
    outputParams: DocumentOutputParams,
  ): Promise<any> {
    const html = await this.generateDynamicHtmlFromTemplate(
      clientData,
      otp,
      requestContext,
      templateDetails,
    );

    if (!html) {
      this.logger.error(
        `HTML generation failed for template: ${templateDetails.name}, path: ${templateDetails.path}`,
        requestContext.sessionId,
        requestContext.trackingId,
        requestContext.requestId,
      );
      throw new Error(
        `Failed to generate HTML for document: ${outputParams.description} - ${outputParams.fileName}`,
      );
    }

    return this.createPdfDocumentFromHtml(
      html,
      docCreationContext,
      outputParams,
      requestContext,
    );
  }

  private async generateDynamicHtmlFromTemplate(
    clientData: ClientDataContext,
    otp: string,
    requestContext: RequestContext,
    templateDetails: TemplateDetails,
  ): Promise<string> {
    try {
      if (!clientData.commercialName || !clientData.identityId) {
        throw new Error(ErrorCodes.CONTRACT_DATA_INVALID);
      }

      formatLogger(
        this.logger,
        'info',
        `Generating HTML for template: ${templateDetails.name}`,
        requestContext.sessionId,
        requestContext.trackingId,
        requestContext.requestId,
      );

      const templateData = {
        templateName: templateDetails.name,
        templatePath: templateDetails.path,
        dynamicData: {
          fullName: clientData.commercialName,
          cityAndDate: new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          otp: otp.toString(),
          identification: clientData.identityId,
          email: clientData.email,
          principalContact: clientData.principalContact,
        },
      };

      const result = await lastValueFrom(
        this.msaTlTemplateGeneratorService.generateTemplate(templateData, {
          trackingId: requestContext.trackingId,
        }),
      );

      if (!result.generatedHtml || result.generatedHtml.length === 0) {
        const error = new Error('Empty contract HTML generated');
        (error as any).code = ErrorCodes.CONTRACT_DATA_INVALID;
        throw error;
      }

      return result.generatedHtml[0];
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Failed to generate HTML for template ${templateDetails.name}: ${error.message}`,
        requestContext.sessionId,
        requestContext.trackingId,
        requestContext.requestId,
      );
      // Propagate the error to be caught by processContractDocumentCreation or signContract
      throw error;
    }
  }

  private async createPdfDocumentFromHtml(
    htmlTemplate: string,
    docCreationContext: DocumentCreationContext,
    outputParams: DocumentOutputParams,
    requestContext: RequestContext,
  ): Promise<any> {
    try {
      if (!htmlTemplate) {
        const error = new Error('Invalid HTML template for contract document');
        (error as any).code = ErrorCodes.DOC_SIGN_FAILED;
        throw error;
      }

      formatLogger(
        this.logger,
        'info',
        `Creating PDF document: ${outputParams.description} (${outputParams.fileName})`,
        requestContext.sessionId,
        requestContext.trackingId,
        requestContext.requestId,
      );

      const documentData = {
        commerceId: docCreationContext.merchantId,
        htmlTemplate,
        description: outputParams.description,
        identification: docCreationContext.identityId, // Uses identityId from docCreationContext (extracted RUC)
        fileName: outputParams.fileName,
        processName: 'onboarding',
        mimeType: 'application/pdf',
        extension: 'pdf',
        tags: ['contract'],
      };

      return await lastValueFrom(
        this.msaNbCnbOrqService.generateDocument(documentData),
      );
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Failed to create PDF document ${outputParams.fileName}: ${error.message}`,
        requestContext.sessionId,
        requestContext.trackingId,
        requestContext.requestId,
      );
      // Propagate the error
      throw error;
    }
  }

  private async sendContractEmail(
    toEmail: string,
    documentResult: any,
    billingDocumentResult: any, // Added billingDocumentResult parameter
    context: ContractEmailContext,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<void> {
    try {
      if (
        !toEmail ||
        !documentResult?.data?.[0]?.signedUrl ||
        !billingDocumentResult?.data?.[0]?.signedUrl // Added check for billingDocumentResult
      ) {
        throw new Error(
          JSON.stringify({
            code: ErrorCodes.NOTIF_DATA_MISSING,
            message:
              'Missing required email notification data (email or signedUrl)',
          }),
        );
      }

      formatLogger(
        this.logger,
        'info',
        `Preparing to send contract email to: ${toEmail}`,
        sessionId,
        trackingId,
        requestId,
      );

      // 2. Preparar valores para dynamicDataForBody
      const now = new Date();
      const date = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      // Calcular hora en UTC-5
      const utcDate = new Date(
        now.toLocaleString('en-US', { timeZone: 'UTC' }),
      );
      const utcMinus5Date = new Date(utcDate.getTime() - 5 * 60 * 60 * 1000);
      const hour = utcMinus5Date.toLocaleTimeString('es-ES', {
        // o 'en-GB' para formato HH:mm
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC', // Formatear la fecha ya ajustada como si fuera UTC
      });

      const fullNameForEmail =
        context.onboardingFullName || context.commercialName;
      const firstName = fullNameForEmail ? fullNameForEmail.split(' ')[0] : '';

      const maskedIdentification = this.maskLastFourWithAsterisks(
        context.onboardingIdentityId,
      );
      const maskedAccountNumber = this.maskLastFourWithAsterisks(
        context.clientAccountId,
      );
      const maskedPrincipalContact = this.maskLastFourWithAsterisks(
        context.principalContact,
      );

      // 4. Construir dynamicDataForBody
      const dynamicDataForBody = {
        date,
        hour,
        fullName: toTitleCase(fullNameForEmail),
        identification: maskedIdentification,
        firstName: toTitleCase(firstName),
        accountNumber: maskedAccountNumber,
        principalContact: maskedPrincipalContact,
        commercialName: context.commercialName,
      };

      formatLogger(
        this.logger,
        'info',
        `Dynamic data for email body: ${JSON.stringify(dynamicDataForBody)}`,
        sessionId,
        trackingId,
        requestId,
      );

      // Generate email subject
      const subjectTemplateResult = await lastValueFrom(
        this.msaTlTemplateGeneratorService.generateTemplate(
          {
            templateName: 'email_electronic_service_contract_subject',
            templatePath:
              'cnb/notifications/email_electronic_service_contract_subject.html',
            dynamicData: {}, // El subject no necesita datos dinámicos según el spec
          },
          { trackingId },
        ),
      );

      if (
        !subjectTemplateResult.generatedHtml ||
        subjectTemplateResult.generatedHtml.length === 0
      ) {
        throw new Error('Empty email subject template generated');
      }
      const emailSubject = subjectTemplateResult.generatedHtml[0];

      // Generate email body
      const bodyTemplateResult = await lastValueFrom(
        this.msaTlTemplateGeneratorService.generateTemplate(
          {
            templateName: 'email_electronic_service_contract_body',
            templatePath:
              'cnb/notifications/email_electronic_service_contract_body.html',
            dynamicData: dynamicDataForBody,
          },
          { trackingId },
        ),
      );

      if (
        !bodyTemplateResult.generatedHtml ||
        bodyTemplateResult.generatedHtml.length === 0
      ) {
        throw new Error('Empty email body template generated');
      }
      const emailBody = bodyTemplateResult.generatedHtml[0];

      const emailNotification = {
        to: [toEmail],
        subject: emailSubject,
        body: emailBody,
        attachments: [
          {
            fileName: documentResult.data[0].fileName,
            contentType: 'application/pdf',
            url: documentResult.data[0].signedUrl,
          },
          {
            fileName: billingDocumentResult.data[0].fileName,
            contentType: 'application/pdf',
            url: billingDocumentResult.data[0].signedUrl,
          },
        ],
      };

      formatLogger(
        this.logger,
        'info',
        `Sending contract email to: ${toEmail}`,
        sessionId,
        trackingId,
        requestId,
      );

      await lastValueFrom(
        this.msaTlNotificationEmailService.sendEmail(emailNotification),
      );
      formatLogger(
        this.logger,
        'info',
        `Contract email sent successfully to: ${toEmail}`,
        sessionId,
        trackingId,
        requestId,
      );
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Failed to send contract email: ${error.message}`,
        sessionId,
        trackingId,
        requestId,
      );
      // No relanzar el error aquí para permitir que el flujo principal de signContract continúe si el envío de correo falla.
      // O relanzar si es un error crítico. Por ahora, solo log.
    }
  }

  private extractOnboardingData(
    onboardingStatus: GetAllOnboardingResponseDto,
  ): {
    commercialName: string;
    establishmentType: string;
    fullAddress: string;
    status: string;
    establishmentNumber: string;
    headquarters: boolean;
    typeClient: string;
    identityId: string;
    email: string;
    onboardingFullName?: string;
  } {
    const confirmData = onboardingStatus.data['confirm-data'];
    const startOnbCnb = onboardingStatus.data['start-onb-cnb'];

    if (!confirmData || !startOnbCnb) {
      throw new Error('Required onboarding data not found');
    }

    const establishmentNumber =
      confirmData.data.establishment.numberEstablishment;
    const rucData = startOnbCnb.data.ruc;

    // Extract commercialName
    let commercialName = '';
    const establishmentAddit = rucData.addit.find(
      (addit) => addit.numeroEstablecimiento === establishmentNumber,
    );

    if (establishmentAddit?.nombreFantasiaComercial) {
      commercialName = establishmentAddit.nombreFantasiaComercial;
    } else {
      const matrizAddit = rucData.addit.find(
        (addit) => addit.tipoEstablecimiento === 'MAT',
      );
      if (matrizAddit?.nombreFantasiaComercial) {
        commercialName = matrizAddit.nombreFantasiaComercial;
      } else {
        commercialName = startOnbCnb.data.companyName;
      }
    }

    // Extract establishmentType
    const establishmentType = establishmentAddit?.tipoEstablecimiento ?? '';

    // Extract fullAddress
    const fullAddress = establishmentAddit?.direccionCompleta ?? '';

    // Extract status
    const status = establishmentAddit?.estado ?? '';

    // Extract headquarters
    const headquarters = establishmentAddit?.matriz === 'SI';

    // Extract typeClient
    const typeClient = rucData.tipoContribuyente;

    // Extract identityId
    const identityId = rucData.rucNumber;

    // Extract email
    const email = startOnbCnb.data.email;

    const onboardingFullName = startOnbCnb.data.fullName;

    return {
      commercialName,
      establishmentType,
      fullAddress,
      status,
      establishmentNumber,
      headquarters,
      typeClient,
      identityId,
      email,
      onboardingFullName,
    };
  }

  private buildErrorResponse(error: any): SignContractResponse {
    return {
      status: 'ERROR',
      message: error.message ?? 'Failed to get OTP data',
      errorCode: error?.code ?? ErrorCodes.AUTH_OTP_INVALID,
      details: {
        getOtpDataResult: 'FAIL',
        errorMessage: error.message,
      },
    };
  }
}
