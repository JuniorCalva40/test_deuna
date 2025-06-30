import { Provider } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RestMsaNbOrqTransactionService } from '../services/rest-msa-nb-orq-transaction.service';
import { FakeMsaNbOrqTransactionService } from '../services/fake-msa-nb-orq-transaction.service';

export const MSA_NB_ORQ_TRANSACTION_SERVICE = 'MSA_NB_ORQ_TRANSACTION_SERVICE';

type ConfigurtionServiceType = 'rest' | 'mock';

/**
 * Factory function for creating the provider for the MSA_NB_ORQ_TRANSACTION_SERVICE.
 * @param configService - The configuration service.
 * @param httpService - The HTTP service.
 * @returns An instance of the IMsaNbOrqTransactionService.
 * @throws Error if MSA_NB_ORQ_TRANSACTION_SERVICE_TYPE is not defined in the configuration or if the configuration service type is unsupported.
 */
export const msaNbOrqTransactionServiceProvider: Provider = {
  provide: MSA_NB_ORQ_TRANSACTION_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const configurationServiceType = configService.get<ConfigurtionServiceType>(
      'MSA_NB_ORQ_TRANSACTION_SERVICE_TYPE',
    );

    if (configurationServiceType === 'mock') {
      return new FakeMsaNbOrqTransactionService();
    }

    return new RestMsaNbOrqTransactionService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
