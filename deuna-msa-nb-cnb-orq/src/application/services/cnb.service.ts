import { Inject } from '@nestjs/common';
import { CnbServicePort } from '../ports/in/services/cnb.service.port';
import { PublishCnbConfigQueueUseCase } from '../use-cases/cnb/public-cnb-config-queue.use-case';
import {
  CNB_QUEUE_PORT,
  CnbQueuePort,
} from '../ports/out/queue/cnb-queue.port';
import { Logger } from '@deuna/tl-logger-nd';
import { ConfigService } from '@nestjs/config';
import { CnbStatusRequestDto } from '../dto/cnb-status-request.dto';
import { CnbStatusResponseDto } from '../dto/cnb-status-response';
import { ConfigurationNb005Dto } from '../dto/configuration/configuration-nb005.dto';
import {
  NB001,
  NB002,
  NB003,
  NB004,
  NB005,
  NB007,
  NB008,
  NB010,
  NB011,
} from '../../domain/constants/configurations.contants';
import { GetSecuenceUseCase } from '../use-cases/cnb/get-secuence.use-case';
import {
  CNB_SECUENCE_PORT,
  CnbSecuencePort,
} from '../ports/out/clients/cnb-secuence.port';
import { GetCnbConfigUseCase } from '../use-cases/cnb/get-cnb-config.use-case';
import {
  CNB_CONFIG_CLIENT_PORT,
  CnbConfigClientPort,
} from '../ports/out/clients/cnb-config-client.port';
import { SendCnbConfigurationsUseCase } from '../use-cases/cnb/send-cnb-configurations.use-case';
import { CnbConfigurationsRequestDto } from '../dto/cnb-configurations-request.dto';
import { CnbConfigurationItem } from '../dto/cnb-configurations-request.dto';
import {
  CNB_CONFIG_SENDER_PORT,
  CnbConfigSenderPort,
} from '../ports/out/clients/cnb-config-sender.port';
import { MerchantClientUseCase } from '../use-cases/merchant/get-merchant-client-data.use-case';
import {
  MERCHANT_CLIENT_PORT,
  MerchantClientPort,
} from '../ports/out/clients/merchant-client.port';
import { MerchantHierarchyUseCase } from '../use-cases/merchant/get-merchant-hierarchy-data.use-case';
import {
  MERCHANT_HIERARCHY_PORT,
  MerchantHierarchyPort,
} from '../ports/out/clients/merchant-hierarchy.port';
import { UpdateCnbConfigUseCase } from '../use-cases/cnb/update-cnb-config.use-case';
import {
  CNB_CONFIG_UPDATE_PORT,
  CnbConfigUpdatePort,
} from '../ports/out/clients/cnb-config-update.port';

export const CNB_PORT = 'CNB_PORT' as const;

export class CnbService implements CnbServicePort {
  private readonly publishCnbConfigQueueUseCase: PublishCnbConfigQueueUseCase;
  private readonly getSecuenceUseCase: GetSecuenceUseCase;
  private readonly getCnbConfigUseCase: GetCnbConfigUseCase;
  private readonly sendCnbConfigurationsUseCase: SendCnbConfigurationsUseCase;
  private readonly merchantClientUseCase: MerchantClientUseCase;
  private readonly merchantHierarchyUseCase: MerchantHierarchyUseCase;
  private readonly updateCnbConfigUseCase: UpdateCnbConfigUseCase;

  constructor(
    @Inject(CNB_QUEUE_PORT)
    private readonly queuePort: CnbQueuePort,
    @Inject(CNB_SECUENCE_PORT)
    private readonly cnbSecuencePort: CnbSecuencePort,
    @Inject(CNB_CONFIG_CLIENT_PORT)
    private readonly cnbConfigClientPort: CnbConfigClientPort,
    @Inject(CNB_CONFIG_SENDER_PORT)
    private readonly cnbConfigSenderPort: CnbConfigSenderPort,
    @Inject(MERCHANT_CLIENT_PORT)
    private readonly merchantClientPort: MerchantClientPort,
    @Inject(MERCHANT_HIERARCHY_PORT)
    private readonly merchantHierarchyPort: MerchantHierarchyPort,
    @Inject(CNB_CONFIG_UPDATE_PORT)
    private readonly cnbConfigUpdatePort: CnbConfigUpdatePort,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {
    this.publishCnbConfigQueueUseCase = new PublishCnbConfigQueueUseCase(
      this.queuePort,
      this.logger,
    );
    this.getSecuenceUseCase = new GetSecuenceUseCase(
      this.cnbSecuencePort,
      this.logger,
    );
    this.getCnbConfigUseCase = new GetCnbConfigUseCase(
      this.cnbConfigClientPort,
      this.logger,
    );
    this.sendCnbConfigurationsUseCase = new SendCnbConfigurationsUseCase(
      this.cnbConfigSenderPort,
      this.logger,
    );
    this.merchantClientUseCase = new MerchantClientUseCase(
      this.merchantClientPort,
      this.logger,
    );
    this.merchantHierarchyUseCase = new MerchantHierarchyUseCase(
      this.merchantHierarchyPort,
      this.logger,
    );
    this.updateCnbConfigUseCase = new UpdateCnbConfigUseCase(
      this.cnbConfigUpdatePort,
      this.logger,
    );
  }

  async completeOnboadingCnb(
    config: CnbStatusRequestDto,
  ): Promise<CnbStatusResponseDto> {
    this.logger.log(
      `init | completeOnboadingCnb | nodeId: ${config.nodeId} response: ${JSON.stringify(
        config,
      )}`,
    );
    await this.publishCnbConfigQueueUseCase.execute(config);
    return {
      nodeId: config.nodeId,
    };
  }

  async sendConfigData(config: CnbStatusRequestDto | string): Promise<void> {
    try {
      this.logger.log(`init | sendConfigData | response: ${config}`);
      if (typeof config === 'string') {
        this.logger.log('Recibido como string, convirtiendo a objeto...');
        config = JSON.parse(config);
      }
      const configData: CnbStatusRequestDto = config as CnbStatusRequestDto;
      const typesClient = {
        'PERSONA NATURAL': 'NATURAL',
        SOCIEDAD: 'JURIDICAL',
      };
      this.logger.log(
        `Verificando configuracion existente para nodeId: ${configData.nodeId}`,
      );

      const [existNB002, existNB001] = await Promise.all([
        this.getCnbConfigUseCase.execute(configData.nodeId, NB002),
        this.getCnbConfigUseCase.execute(configData.nodeId, NB001),
      ]);

      if (existNB002?.data || existNB001?.data) {
        this.logger.log(
          `finish | sendConfigData | Exist config for ${configData.nodeId}`,
        );
        return;
      }

      this.logger.log(
        `init | sendConfigData | response: ${JSON.stringify(config)}`,
      );

      const contractSecuence = await this.getSecuenceUseCase.execute();

      this.logger.log(
        `during | getSecuenceUseCase | secuence: ${contractSecuence}`,
      );

      const configDefault = {
        nodeId: configData.nodeId,
        encrypted: false,
        clientType: typesClient[configData.typeClient],
      };

      const configurationsRequest: CnbConfigurationsRequestDto = {
        configurations: [
          {
            ...configDefault,
            configName: NB011,
            configData: {
              code: 36,
              description: 'TIENDA',
            },
          },
          {
            ...configDefault,
            configName: NB010,
            configData: {
              affiliationDate: new Date().toISOString(),
              contractDate: new Date().toISOString(),
            },
          },
          {
            ...configDefault,
            configName: NB008,
            configData: {
              contractCode: contractSecuence,
            },
          },
          {
            ...configDefault,
            configName: NB007,
            configData: {
              latitude: configData.latitude,
              longitude: configData.longitude,
            },
          },
          {
            ...configDefault,
            configName: NB005,
            configData: {
              status: 'REQUESTED',
              referenceTransaction: configData.referenceTransaction,
            },
          },
          {
            ...configDefault,
            configName: NB004,
            configData: {
              commercialName: configData.commercialName,
            },
          },
          {
            ...configDefault,
            configName: NB003,
            configData: {
              products_and_services: this.configService
                .get<string>('CNB_CAPABILITIES')
                .split(','),
            },
          },
          {
            ...configDefault,
            configName: NB002,
            configData: {
              commercialName: configData.commercialName,
              establishmentType: configData.establishmentType,
              fullAddress: configData.fullAddress,
              status: configData.status,
              establishmentNumber: configData.establishmentNumber,
              headquarters: configData.headquarters,
            },
          },
          {
            ...configDefault,
            configName: NB001,
            configData: {
              status: 'ACTIVE',
            },
          },
        ],
      };

      await this.sendCnbConfigurationsUseCase.execute(configurationsRequest);

      this.logger.log(
        `finish | sendConfigData | processed for ${configData.nodeId}`,
      );
    } catch (error) {
      this.logger.error('error | sendConfigData | CnbService', error);
    }
  }

  async updateConfigNb005(config: ConfigurationNb005Dto): Promise<void> {
    try {
      this.logger.log(
        `init | updateConfigNb005 | request: ${JSON.stringify(config)}`
      );

      const clientId = await this.merchantClientUseCase.execute(
        config.identificationNumber,
      );

      const nodeId = await this.merchantHierarchyUseCase.execute(clientId);

      const getConfig = await this.getCnbConfigUseCase.execute(
        nodeId,
        NB005,
      );

      if (!getConfig?.data?.id) {
        throw new Error(`NB005 config not found for nodeId: ${nodeId}`);
      }

      const configId = getConfig.data.id;

      const configItem: CnbConfigurationItem = {
        nodeId: nodeId,
        configName: NB005,
        encrypted: getConfig.data.encrypted,
        clientType: getConfig.data.clientType,
        configData: {
          issuer: config.issuer,
          issueDate: config.issueDate,
          expirationDate: config.expirationDate,
          referenceTransaction: config.referenceTransaction,
          status: config.status,
        },
      };

      await this.updateCnbConfigUseCase.execute(configId, configItem);

      this.logger.log(
        `finish | updateConfigNb005 | Updated NB005 config for nodeId: ${nodeId}`,
      );
    } catch (error) {
      this.logger.error(
        `error | updateConfigNb005 | Failed to update NB005 config`,
        error,
      );
      throw error;
    }
  }
}
