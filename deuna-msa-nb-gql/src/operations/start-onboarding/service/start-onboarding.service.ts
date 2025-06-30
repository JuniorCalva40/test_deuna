import { Injectable, Inject } from '@nestjs/common';
import {
  StartOnboardingResponse,
  ClientData,
  OnboardingSessionOutput,
} from '../dto/start-onboarding-response.dto';
import { lastValueFrom } from 'rxjs';
import { IMsaNbClientService } from '../../../external-services/msa-nb-cnb-service/interfaces/msa-nb-client-service.interface';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { EstablishmentOutputDto } from '../../../utils/establishment.dto';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { v4 as uuidv4 } from 'uuid';
import {
  AdditDto,
  StartOnboardingInput,
} from '../dto/start-onboarding-input.dto';
import { ISaveElectronicSignatureResponseRedis } from '../../cnb-document-validation-start/dto/document-validation-response.dto';
import { Logger } from '@deuna/tl-logger-nd';
import { formatLogger } from '../../../utils/format-logger';
import { McBoConfigCnbAddressDto } from '../../../external-services/msa-mc-bo-configuration/dto/get-config-cnb-address.dto';
import { IMsaMcBoConfigurationService } from '../../../external-services/msa-mc-bo-configuration/interfaces/msa-mc-bo-configuration-service.interface';
import { MSA_MC_BO_CONFIGURATION_SERVICE } from '../../../external-services/msa-mc-bo-configuration/providers/msa-mc-bo-configuration.provider';
import { IMsaMcBoHierarchyService } from '../../../external-services/msa-mc-bo-hierarchy/interfaces/msa-mc-bo-hierarchy-service.interface';
import { MSA_MC_BO_HIERARCHY_SERVICE } from '../../../external-services/msa-mc-bo-hierarchy/providers/msa-mc-bo-hierarchy.provider';
import { IMsaMcBoClientService } from '../../../external-services/msa-mc-bo-client/interfaces/msa-mc-bo-client.interface';
import { MSA_MC_BO_CLIENT_SERVICE } from '../../../external-services/msa-mc-bo-client/providers/msa-mc-bo-client.provider';
import { MSA_NB_CNB_ORQ_SERVICE } from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { IMsaNbCnbOrqService } from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';

@Injectable()
export class StartOnboardingService {
  private readonly logger = new Logger({
    context: StartOnboardingService.name,
  });
  private readonly CONTEXT = 'start-onboarding';

  constructor(
    @Inject('MSA_NB_CLIENT_SERVICE')
    private readonly cnbClientServiceNb: IMsaNbClientService,
    @Inject('MSA_CO_ONBOARDING_STATE_SERVICE')
    private readonly msaCoOnboardingStatusService: IMsaCoOnboardingStatusService,
    @Inject(MSA_MC_BO_CONFIGURATION_SERVICE)
    private configurationService: IMsaMcBoConfigurationService,
    @Inject(MSA_MC_BO_HIERARCHY_SERVICE)
    private hierarchyService: IMsaMcBoHierarchyService,
    @Inject(MSA_MC_BO_CLIENT_SERVICE)
    private clientServiceMc: IMsaMcBoClientService,
    @Inject(MSA_NB_CNB_ORQ_SERVICE)
    private msaNbCnbOrqService: IMsaNbCnbOrqService,
  ) {}

  private async prepareDataSignElectronic(
    input: StartOnboardingInput,
    rucNumber: string,
  ): Promise<ISaveElectronicSignatureResponseRedis> {
    return await this.msaNbCnbOrqService.createElectronicSign(
      {
        identificationNumber: input.identification,
        applicantName: input.applicantName,
        applicantLastName: input.applicantLastName,
        emailAddress: input.email,
        cellphoneNumber: input.phoneNumber,
        companyRuc: rucNumber,
      },
      {
        sessionId: input.sessionId,
        trackingId: input.trackingId,
        requestId: input.requestId,
      },
    );
  }

  private processEstablishments(
    additAddress: AdditDto[],
  ): EstablishmentOutputDto[] {
    return (
      additAddress
        .filter((est) => est.estado === 'ABIERTO')
        .map((est) => ({
          fullAddress: est.direccionCompleta,
          numberEstablishment: est.numeroEstablecimiento,
        })) || []
    );
  }

  async startOnboarding(
    input: StartOnboardingInput,
  ): Promise<StartOnboardingResponse> {
    try {
      input.requestId = uuidv4();
      formatLogger(
        this.logger,
        'info',
        `Finished get merchant data for merchant identification ${input.identification} into into msa-nb-cnb-service`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );
      // Get client data
      const clientData = (await lastValueFrom(
        this.cnbClientServiceNb.getClientByIdentification(input.identification),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-nb-cnb-service getClientByIdentification for merchant identification ${input.identification}: ${error}`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
        ErrorHandler.handleError(
          'Error fetching client data from msa-nb-cnb-service',
          ErrorCodes.CNB_SERVICE_ERROR,
        );
      })) as ClientData;

      if (!clientData.id) {
        return ErrorHandler.handleError(
          {
            code: ErrorCodes.CLIENT_ID_INVALID,
            message: 'Client not found with the provided identification',
          },
          'start-onboarding',
        );
      }

      input.requestId = uuidv4();
      formatLogger(
        this.logger,
        'info',
        `Starting init onboarding for merchant identification ${input.identification} into msa-co-onboarding-status-service`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );

      // Initialize onboarding
      const initOnboardingResponse = (await lastValueFrom(
        this.msaCoOnboardingStatusService.initOnboarding({
          identityId: input.identification,
          onbType: 'onb_cnb',
          securitySeed: '5fd924625f6ab16a1',
          publicKey:
            '5fd924625f6ab16a19cc9807c7c506ae1813490e4ba675f843d5a10e0baacdb8',
        }),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-co-onboarding-status-service initOnboarding for merchant identification ${input.identification}: ${error}`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
        ErrorHandler.handleError(
          'Error initializing onboarding process in msa-co-onboarding-status-service',
          ErrorCodes.ONB_SERVICE_ERROR,
        );
      })) as OnboardingSessionOutput;

      formatLogger(
        this.logger,
        'info',
        `Finished init onboarding for merchant identification ${input.identification} in msa-co-onboarding-status-service`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );
      if (!initOnboardingResponse.sessionId) {
        return ErrorHandler.handleError(
          {
            code: ErrorCodes.ONB_DATA_INCOMPLETE,
            message:
              'Failed to initialize onboarding process - Missing session ID',
          },
          'start-onboarding',
        );
      }

      input.requestId = uuidv4();
      formatLogger(
        this.logger,
        'info',
        `Starting get client-mc by identification ${input.identification} into msa-bo-mc-client`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );
      const clientMc = await lastValueFrom(
        this.clientServiceMc.getClientData({
          identification: input.identification,
        }),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-bo-mc-client for identification ${input.identification}: ${error}`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
        ErrorHandler.handleError(
          'Error fetching client data',
          ErrorCodes.CNB_SERVICE_ERROR,
        );
      });

      formatLogger(
        this.logger,
        'info',
        `Finished get client-mc by identification ${input.identification} into msa-bo-mc-client`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );

      input.requestId = uuidv4();

      formatLogger(
        this.logger,
        'info',
        `Starting get nodes into msa-co-hierarchy for clientMc ${clientMc.id}`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );
      // Get nodes into msa-co-hierarchy
      const nodes = await lastValueFrom(
        this.hierarchyService.getHierarchyNodes(clientMc.id),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-co-hierarchy for clientMc ${clientMc.id}: ${error}`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
        ErrorHandler.handleError(
          'Error fetching nodes',
          ErrorCodes.CNB_SERVICE_ERROR,
        );
      });

      formatLogger(
        this.logger,
        'info',
        `Finished get nodes into msa-co-hierarchy for clientMc ${clientMc.id}`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );

      if (nodes?.items?.length) {
        // Get config cnb address
        input.requestId = uuidv4();
        const configAddress = (await lastValueFrom(
          this.configurationService.getConfigCnbAddress(
            nodes.items[0].id.toString(),
          ),
        ).catch((error) => {
          formatLogger(
            this.logger,
            'error',
            `Error received in service msa-mc-bo-configuration for nodes ${nodes.items[0].id}: ${error}`,
            input.sessionId,
            input.trackingId,
            input.requestId,
          );
          ErrorHandler.handleError(
            'Error fetching config address',
            ErrorCodes.CNB_SERVICE_ERROR,
          );
        })) as McBoConfigCnbAddressDto;

        formatLogger(
          this.logger,
          'info',
          `Finished get config cnb address into msa-mc-bo-configuration for nodeId ${nodes.items[0].id}`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );

        if (!configAddress.configData.addit) {
          ErrorHandler.handleError(
            'Invalid cnb address list, the address is missing',
            ErrorCodes.CNB_CLIENT_INVALID_ADDRESS,
          );
        }
        const additAddress = configAddress.configData.addit;

        const activeEstablishments = this.processEstablishments(additAddress);
        const rucNumber = configAddress.configData.numeroRuc;

        input.requestId = uuidv4();
        formatLogger(
          this.logger,
          'info',
          `Starting update client-cnb data for client ID ${clientData.id}, merchant ID ${input.id}, ruc ${rucNumber} into msa-nb-cnb-service`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );

        // Update client commerce ID and ruc if provided
        const updateSuccess = await lastValueFrom(
          this.cnbClientServiceNb.updateClientData(
            clientData.id,
            input.id,
            rucNumber,
          ),
        ).catch((error) => {
          formatLogger(
            this.logger,
            'error',
            `Error received in service msa-nb-cnb-service updateClientData for client ID ${clientData.id}, merchant ID ${input.id}, ruc ${rucNumber}: ${error}`,
            input.sessionId,
            input.trackingId,
            input.requestId,
          );
          ErrorHandler.handleError(
            'Error updating client-cnb data in msa-nb-cnb-service',
            ErrorCodes.CNB_SERVICE_ERROR,
          );
        });

        formatLogger(
          this.logger,
          'info',
          `Finished update client-cnb data for client ID ${clientData.id}, merchant ID ${input.id}, ruc ${rucNumber} in msa-nb-cnb-service`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
        if (!updateSuccess) {
          return ErrorHandler.handleError(
            {
              code: ErrorCodes.CLIENT_UPDATE_FAILED,
              message: 'Failed to update client-cnb data in msa-nb-cnb-service',
            },
            'start-onboarding',
          );
        }
        // Start onboarding process
        const startOnboardingResponse = await lastValueFrom(
          this.msaCoOnboardingStatusService.startOnboarding({
            sessionId: initOnboardingResponse.sessionId,
            status: 'SUCCESS',
            data: {
              username: input.username,
              companyName: configAddress.configData.razonSocial,
              cnbClientId: clientData.id,
              ruc: {
                rucNumber: rucNumber,
                estadoContribuyenteRuc:
                  configAddress.configData.estadoContribuyenteRuc,
                actividadEconomicaPrincipal:
                  configAddress.configData.actividadEconomicaPrincipal,
                tipoContribuyente:
                  configAddress.configData.tipoContribuyente,
                regimen: configAddress.configData.regimen,
                categoria: configAddress.configData.categoria,
                obligadoLlevarContabilidad:
                  configAddress.configData.obligadoLlevarContabilidad,
                agenteRetencion: configAddress.configData.agenteRetencion,
                contribuyenteEspecial:
                  configAddress.configData.contribuyenteEspecial,
                informacionFechasContribuyente: {
                  fechaInicioActividades:
                    configAddress.configData.informacionFechasContribuyente
                      .fechaInicioActividades,
                  fechaCese:
                    configAddress.configData.informacionFechasContribuyente
                      .fechaCese,
                  fechaReinicioActividades:
                    configAddress.configData.informacionFechasContribuyente
                      .fechaReinicioActividades,
                  fechaActualizacion:
                    configAddress.configData.informacionFechasContribuyente
                      .fechaActualizacion,
                },
                addit: configAddress.configData.addit,
              },
              email: input.email,
              establishment: activeEstablishments,
              fullName: input.businessName,
              trackingId: input.trackingId,
            },
          }),
        );

        if (!startOnboardingResponse) {
          return ErrorHandler.handleError(
            {
              code: ErrorCodes.ONB_FLOW_BLOCKED,
              message: 'Failed to start onboarding process',
            },
            'start-onboarding',
          );
        }

        const saveElectronicSignatureResponse =
          await this.prepareDataSignElectronic(input, rucNumber);
        if (!saveElectronicSignatureResponse) {
          return ErrorHandler.handleError(
            {
              code: ErrorCodes.REDIS_SAVE_ERROR,
              message:
                'Failed to save electronic signature request data in msa-nb-cnb-orq',
            },
            'start-onboarding',
          );
        }

        return {
          onboardingSessionId: initOnboardingResponse.sessionId,
          establishments: activeEstablishments,
          status: 'SUCCESS',
        };
      }

      return ErrorHandler.handleError(
        {
          code: ErrorCodes.ONB_DATA_INCOMPLETE,
          message: 'Failed to fetch nodes from msa-co-hierarchy',
        },
        'start-onboarding',
      );
    } catch (error: unknown) {
      return ErrorHandler.handleError(
        {
          code: ErrorCodes.SYS_PROCESS_FAILED,
          message:
            error instanceof Error
              ? error.message
              : 'Unexpected error during onboarding process',
          details: error,
        },
        'start-onboarding',
      );
    }
  }
}
