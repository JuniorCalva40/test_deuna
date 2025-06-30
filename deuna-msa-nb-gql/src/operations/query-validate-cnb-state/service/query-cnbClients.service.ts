import { Injectable, Inject } from '@nestjs/common';
import { DataResponse } from '../dto/validate-cnb-state.response.dto';
import { lastValueFrom } from 'rxjs';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { MSA_MC_BO_CLIENT_SERVICE } from '../../../external-services/msa-mc-bo-client/providers/msa-mc-bo-client.provider';
import { IMsaMcBoClientService } from '../../../external-services/msa-mc-bo-client/interfaces/msa-mc-bo-client.interface';
import { MSA_MC_BO_CONFIGURATION_SERVICE } from '../../../external-services/msa-mc-bo-configuration/providers/msa-mc-bo-configuration.provider';
import { IMsaMcBoConfigurationService } from '../../../external-services/msa-mc-bo-configuration/interfaces/msa-mc-bo-configuration-service.interface';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-cnb-service/providers/msa-nb-client-service.provider';
import { IMsaNbClientService } from '../../../external-services/msa-nb-cnb-service/interfaces/msa-nb-client-service.interface';
import { ValidateCnbStateInput } from '../dto/validate-cnb-state.input.dto';
import { AdditDto, ConfigCnbAddressDto } from '../dto/config-cnb-address.dto';
import { Logger } from '@deuna/tl-logger-nd';
import { formatLogger } from '../../../utils/format-logger';
import { v4 as uuidv4 } from 'uuid';
import { CnbState, PreApprovedState } from '../../../common/constants/common';
import { IMsaMcBoHierarchyService } from '../../../external-services/msa-mc-bo-hierarchy/interfaces/msa-mc-bo-hierarchy-service.interface';
import { MSA_MC_BO_HIERARCHY_SERVICE } from '../../../external-services/msa-mc-bo-hierarchy/providers/msa-mc-bo-hierarchy.provider';
import { EstablishmentValidateCnbOutputDto } from '../../../utils/establishment.dto';
import { CnbClient } from '../dto/cnb-client.dto';
import { MSA_TL_BP_DATA_PROVIDER_SERVICE } from '../../../external-services/msa-tl-bp-data-provider/providers/msa-tl-bp-data-provider';
import { IMsaTlBpDataProviderService } from '../../../external-services/msa-tl-bp-data-provider/interfaces/msa-tl-bp-data-provider.interface';
import {
  IMsaNbCnbOrqService,
  MSA_NB_CNB_ORQ_SERVICE,
} from '../../../external-services/msa-nb-cnb-orq/interfaces/msa-nb-cnb-orq-service.interface';
import { BlackListValidationRequest } from '../../../external-services/msa-nb-cnb-orq/dto/msa-nb-cnb-orq-input.dto';

interface CnbConfigData {
  status: string;
}

@Injectable()
export class CnbClientsService {
  private readonly logger = new Logger({
    context: CnbClientsService.name,
  });
  private readonly CONTEXT = 'validate-cnb-state';

  constructor(
    @Inject(MSA_NB_CLIENT_SERVICE)
    private cnbClientServiceNb: IMsaNbClientService,
    @Inject(MSA_MC_BO_CLIENT_SERVICE)
    private clientServiceMc: IMsaMcBoClientService,
    @Inject(MSA_MC_BO_HIERARCHY_SERVICE)
    private hierarchyService: IMsaMcBoHierarchyService,
    @Inject(MSA_MC_BO_CONFIGURATION_SERVICE)
    private configurationService: IMsaMcBoConfigurationService,
    @Inject(MSA_TL_BP_DATA_PROVIDER_SERVICE)
    private readonly dataProviderService: IMsaTlBpDataProviderService,
    @Inject(MSA_NB_CNB_ORQ_SERVICE)
    private readonly orqService: IMsaNbCnbOrqService,
  ) {}

  private processEstablishments(
    additAddress: AdditDto[],
  ): EstablishmentValidateCnbOutputDto[] {
    return (
      additAddress
        .filter((est) => est.estado === 'ABIERTO')
        .map((est) => ({
          fullAddress: est.direccionCompleta,
          numberEstablishment: est.numeroEstablecimiento,
          state: est.estado,
          headquarters: est.matriz,
          establishmentType: est.tipoEstablecimiento,
          commercialName: est.nombreFantasiaComercial,
        })) || []
    );
  }

  async validateCnbState(
    inputData: ValidateCnbStateInput,
  ): Promise<DataResponse> {
    try {
      // Validate identification parameter
      if (!inputData?.identification?.trim()) {
        ErrorHandler.handleError(
          'Identification is required',
          ErrorCodes.CNB_CLIENT_NOT_FOUND,
        );
      }

      formatLogger(
        this.logger,
        'info',
        `Starting get client-cnb preApprovedState by identification ${inputData.identification} into msa-nb-cnb-service`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );

      // Get client by identification into msa-nb-client(cnb)
      const cnbClient = await lastValueFrom(
        this.cnbClientServiceNb.getClientByIdentification(
          inputData.identification,
        ),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-nb-cnb-service preApprovedState for identification ${inputData.identification}: ${error}`,
          inputData.sessionId,
          inputData.trackingId,
          inputData.requestId,
        );
        ErrorHandler.handleError(
          'Error fetching cnb-client data',
          ErrorCodes.CNB_SERVICE_ERROR,
        );
      });

      formatLogger(
        this.logger,
        'info',
        `Finished get client-cnb preApprovedState by identification ${inputData.identification} into msa-nb-cnb-service`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );
      if (!cnbClient) {
        ErrorHandler.handleError(
          'Cnb-client not found',
          ErrorCodes.CNB_CLIENT_NOT_FOUND,
        );
      }

      // validate client status in DB clients
      await this.validateClientCnbBlockedTmpStatus(
        cnbClient,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );

      // Validate client status
      if (!cnbClient.status) {
        ErrorHandler.handleError(
          'Invalid cnb-client status, the status is missing',
          ErrorCodes.CNB_INVALID_STATUS,
        );
      }

      const preApprovedCnbState = cnbClient?.status;
      console.debug('preApprovedCnbState', preApprovedCnbState);
      console.debug('cnbClient', cnbClient);
      const remainingAttemptsOnb = cnbClient?.remainingAttemptsOnb || 0;
      console.debug('remainingAttemptsOnb', remainingAttemptsOnb);

      inputData.requestId = uuidv4();

      formatLogger(
        this.logger,
        'info',
        `Starting get client-mc by identification ${inputData.identification} into msa-bo-mc-client`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );
      const clientMc = await lastValueFrom(
        this.clientServiceMc.getClientData({
          identification: inputData.identification,
        }),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-bo-mc-client for identification ${inputData.identification}: ${error}`,
          inputData.sessionId,
          inputData.trackingId,
          inputData.requestId,
        );
        ErrorHandler.handleError(
          'Error fetching client data',
          ErrorCodes.CNB_SERVICE_ERROR,
        );
      });

      formatLogger(
        this.logger,
        'info',
        `Finished get client-mc by identification ${inputData.identification} into msa-bo-mc-client`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );
      if (!clientMc) {
        ErrorHandler.handleError(
          'Client not found',
          ErrorCodes.CNB_CLIENT_NOT_FOUND,
        );
      }
      // Validate client status
      if (!clientMc?.id) {
        ErrorHandler.handleError(
          'Invalid client id, the id is missing',
          ErrorCodes.CNB_INVALID_STATUS,
        );
      }
      inputData.requestId = uuidv4();

      formatLogger(
        this.logger,
        'info',
        `Starting get nodes into msa-co-hierarchy for clientMc ${clientMc.id}`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );
      // Get nodes into msa-co-hierarchy
      const nodes = await lastValueFrom(
        this.hierarchyService.getHierarchyNodes(clientMc.id),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-co-hierarchy for clientMc ${clientMc.id}: ${error}`,
          inputData.sessionId,
          inputData.trackingId,
          inputData.requestId,
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
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );
      const nodeId = nodes.items[0].id.toString();

      inputData.requestId = uuidv4();
      formatLogger(
        this.logger,
        'info',
        `Starting get config cnbState into msa-mc-bo-configuration for nodeId ${nodeId}`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );

      const getConfigCnbState = await lastValueFrom(
        this.configurationService.getConfigCnbState(nodeId),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received cnbState in service msa-mc-bo-configuration for nodeId ${nodeId}: ${error}`,
          inputData.sessionId,
          inputData.trackingId,
          inputData.requestId,
        );
        ErrorHandler.handleError(
          'Error fetching config client state',
          ErrorCodes.CNB_SERVICE_ERROR,
        );
      });

      formatLogger(
        this.logger,
        'info',
        `Finished get config cnbState into msa-mc-bo-configuration for nodeId ${nodeId}`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );
      let cnbConfigState: CnbState | null = (
        getConfigCnbState?.configData as unknown as CnbConfigData
      )?.status as CnbState;

      if (!cnbConfigState) {
        cnbConfigState = null;
      }
      inputData.requestId = uuidv4();
      formatLogger(
        this.logger,
        'info',
        `Starting get config cnb address into msa-mc-bo-configuration for nodeId ${nodeId}`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );
      // Get node configuration into msa-mc-bo-configuration
      const getConfigCnbRucInfo: ConfigCnbAddressDto = await lastValueFrom(
        this.configurationService.getConfigCnbAddress(nodeId),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-mc-bo-configuration for nodeId ${nodeId}: ${error}`,
          inputData.sessionId,
          inputData.trackingId,
          inputData.requestId,
        );
        ErrorHandler.handleError(
          'Error fetching config client address',
          ErrorCodes.CNB_CONFIG_ADDRESS_ERROR,
        );
      });

      formatLogger(
        this.logger,
        'info',
        `Finished get config cnb address into msa-mc-bo-configuration for nodeId ${nodeId}`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );

      if (!getConfigCnbRucInfo.configData?.addit) {
        ErrorHandler.handleError(
          'Invalid cnb address, the address is missing',
          ErrorCodes.CNB_CLIENT_INVALID_ADDRESS,
        );
      }

      const additAddress = getConfigCnbRucInfo.configData?.addit;
      const activeEstablishments = this.processEstablishments(additAddress);

      let isBlacklisted = false;
      if (preApprovedCnbState === PreApprovedState.APPROVED) {
        isBlacklisted = await this.validateCnbBlacklistStatus(inputData);
      }

      const response: DataResponse = {
        status: 'SUCCESS',
        cnbState: cnbConfigState,
        preApprovedState: isBlacklisted ? PreApprovedState.INACTIVE : preApprovedCnbState  ,
        merchantName: inputData.comercialName,
        address: activeEstablishments,
        remainingAttemptsOnb: remainingAttemptsOnb,
      };

      return response;
    } catch (error) {
      formatLogger(
        this.logger,
        'error',
        `Error received in service - operation validate-cnb-state: ${error}`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );
      return ErrorHandler.handleError(
        `Service - operation validate-cnb-state: ${error}`,
        ErrorCodes.CNB_SERVICE_ERROR,
      );
    }
  }

  private async validateClientCnbBlockedTmpStatus(
    cnbClient: CnbClient,
    sessionId: string,
    trackingId: string,
    requestId: string,
  ): Promise<void> {
    if (cnbClient.status === PreApprovedState.BLOCKED_TMP) {
      const blockedAt = cnbClient.blockedTmpAt;
      const blockedAtDate = new Date(blockedAt);
      const currentDate = new Date();
      const diffTime = Math.abs(
        currentDate.getTime() - blockedAtDate.getTime(),
      );
      // Calculate difference in minutes
      const diffMinutes = diffTime / (1000 * 60);
      const maxBlockMinutes = 10;

      if (diffMinutes < maxBlockMinutes) {
        // Calculate remaining time in milliseconds
        const remainingMilliseconds = maxBlockMinutes * 60 * 1000 - diffTime;
        const remainingTotalSeconds = Math.ceil(remainingMilliseconds / 1000);
        const minutes = Math.floor(remainingTotalSeconds / 60);
        const seconds = remainingTotalSeconds % 60;

        ErrorHandler.handleError(
          `Client is temporarily blocked by the OTP. Time remaining: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
          ErrorCodes.CLIENT_BLOCKED_TMP_OTP,
        );
      }
      requestId = uuidv4();
      formatLogger(
        this.logger,
        'info',
        `Starting update client-cnb status to ${PreApprovedState.APPROVED} for client ID ${cnbClient.id} into msa-nb-cnb-service`,
        sessionId,
        trackingId,
        requestId,
      );
      await lastValueFrom(
        this.cnbClientServiceNb.updateClientStatus({
          clientId: cnbClient.id,
          status: PreApprovedState.APPROVED,
        }),
      ).catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-nb-cnb-service updateClientStatus for client-cnb ID ${cnbClient.id}: ${error}`,
          sessionId,
          trackingId,
          requestId,
        );
        ErrorHandler.handleError(
          `Error updating client status to ${PreApprovedState.APPROVED} in msa-nb-cnb-service`,
          ErrorCodes.CNB_SERVICE_ERROR,
        );
      });

      formatLogger(
        this.logger,
        'info',
        `Finished update client-cnb status to ${PreApprovedState.APPROVED} for client ID ${cnbClient.id} in msa-nb-cnb-service`,
        sessionId,
        trackingId,
        requestId,
      );
    }
  }

  private async validateCnbBlacklistStatus(
    inputData: ValidateCnbStateInput,
  ): Promise<boolean> {
    formatLogger(
      this.logger,
      'info',
      `Starting get blacklist into msa-tl-bp-data-provider for identification ${inputData.identification}`,
      inputData.sessionId,
      inputData.trackingId,
      inputData.requestId,
    );

    const blacklistRedisValidation =
      await this.validateCnbStateOnRedis(inputData);

    if (blacklistRedisValidation.found) {
      return blacklistRedisValidation.isBlacklisted;
    }

    const validateBlacklist = await lastValueFrom(
      this.dataProviderService.validateBlacklist({
        sessionId: inputData.sessionId,
        trackingId: inputData.trackingId,
        blackListOption: 'PROV,PLAPP',
        identification: inputData.identification,
        fullName: inputData.fullName,
      }),
    ).catch((error) => {
      formatLogger(
        this.logger,
        'error',
        `Error received in service msa-tl-bp-data-provider for identification ${inputData.identification}: ${error}`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );
      ErrorHandler.handleError(
        'Error validating blacklist',
        ErrorCodes.TL_BP_DATA_PROVIDER_ERROR,
      );
    });

    formatLogger(
      this.logger,
      'info',
      `Finished validate blacklist into msa-tl-bp-data-provider for identification ${inputData.identification}`,
      inputData.sessionId,
      inputData.trackingId,
      inputData.requestId,
    );
    const isBlacklisted =
      validateBlacklist?.result?.[0]?.isUserOnBlackList || false;

    await this.saveCnbStateOnRedis(inputData, isBlacklisted);
    return isBlacklisted;
  }

  private async validateCnbStateOnRedis(
    inputData: ValidateCnbStateInput,
  ): Promise<{ found: boolean; isBlacklisted: boolean }> {
    formatLogger(
      this.logger,
      'info',
      `Starting get cnb state into msa-nb-cnb-orq for identification ${inputData.identification}`,
      inputData.sessionId,
      inputData.trackingId,
      inputData.requestId,
    );
    const blackListInfo = await lastValueFrom(
      this.orqService.getCnbState(inputData.identification, {
        sessionId: inputData.sessionId,
        trackingId: inputData.trackingId,
        requestId: inputData.requestId,
      }),
    ).catch((error) => {
      formatLogger(
        this.logger,
        'error',
        `Error received in service msa-nb-cnb-orq  for identification ${inputData.identification}: ${error}`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );
      ErrorHandler.handleError(
        'Error validating cnb state on redis',
        ErrorCodes.REDIS_GET_ERROR,
      );
    });

    formatLogger(
      this.logger,
      'info',
      `Finished validate cnb state into msa-nb-cnb-orq for identification ${inputData.identification}`,
      inputData.sessionId,
      inputData.trackingId,
      inputData.requestId,
    );

    if (blackListInfo.status === 'found') {
      const response = blackListInfo as BlackListValidationRequest;
      return {
        isBlacklisted: response.isBlacklisted,
        found: true,
      };
    }

    return { isBlacklisted: false, found: false };
  }

  private async saveCnbStateOnRedis(
    inputData: ValidateCnbStateInput,
    isBlacklisted: boolean,
  ): Promise<void> {
    formatLogger(
      this.logger,
      'info',
      `Starting save cnb state into msa-nb-cnb-orq for identification ${inputData.identification}`,
      inputData.sessionId,
      inputData.trackingId,
      inputData.requestId,
    );
    await lastValueFrom(
      this.orqService.saveCnbState(
        { isBlacklisted, identification: inputData.identification },
        {
          sessionId: inputData.sessionId,
          trackingId: inputData.trackingId,
          requestId: inputData.requestId,
        },
      ),
    ).catch((error) => {
      formatLogger(
        this.logger,
        'error',
        `Error received in service msa-nb-cnb-orq for identification ${inputData.identification}: ${error}`,
        inputData.sessionId,
        inputData.trackingId,
        inputData.requestId,
      );
      ErrorHandler.handleError(
        'Error saving cnb state',
        ErrorCodes.REDIS_SAVE_ERROR,
      );
    });

    formatLogger(
      this.logger,
      'info',
      `Finished validate cnb state into msa-nb-cnb-orq for identification ${inputData.identification}`,
      inputData.sessionId,
      inputData.trackingId,
      inputData.requestId,
    );
  }
}
