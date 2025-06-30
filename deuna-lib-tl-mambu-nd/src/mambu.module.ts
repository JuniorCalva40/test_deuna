import { DynamicModule, Module } from '@nestjs/common';

import { LoggerModule } from '@deuna/tl-logger-nd';
import { HttpModule } from '@nestjs/axios';
import { MAMBU_CLIENT } from './mambu-core/constants/constants';
import { MambuAuthService } from './mambu-core/mambu-auth.service';
import { MambuRestService } from './mambu-core/mambu-rest.service';
import {
  MambuApiKeyAuthOptions,
  MambuBasiAuthOptions,
} from './mambu-core/mambu.types';
import { ClientService } from './mambu-core/usecases/clients/client.service';
import { DepositAccountService } from './mambu-core/usecases/deposit-accounts/deposit-account.service';
import { DepositTransactionService } from './mambu-core/usecases/deposit-transactions/deposit-transaction.service';
import { GLAccountService } from './mambu-core/usecases/gl-accounts/gl-account.service';
import { DeunaClientsService } from './mambu-deuna/usecases/clients/deuna-clients.service';
import { DeunaDepositAccountsService } from './mambu-deuna/usecases/deposit-accounts/deuna-deposit-accounts.service';
import { DeunaGLAccountService } from './mambu-deuna/usecases/gl-accounts/deuna-gl-account.service';
import { DeunaClientContactService } from './mambu-deuna/usecases/clients/use-cases/contacts/deuna-clients-contact.service';
import { DeunaClientUpdateService } from './mambu-deuna/usecases/clients/use-cases/update/deuna-clients-update.service';

@Module({})
export class MambuModule {
  static register(
    options: MambuApiKeyAuthOptions | MambuBasiAuthOptions,
  ): DynamicModule {
    const providers = [];
    providers.push(MambuAuthService);
    providers.push(ClientService);
    providers.push(DepositAccountService);
    providers.push(DepositTransactionService);
    providers.push(MambuRestService);
    providers.push(GLAccountService);
    const customProviders = [];
    customProviders.push(DeunaDepositAccountsService);
    customProviders.push(DeunaClientsService);
    customProviders.push(DeunaClientContactService);
    customProviders.push(DeunaClientUpdateService);
    customProviders.push(DeunaGLAccountService);

    console.log(`Mambu initiated on ${options.domain}`);
    return {
      module: MambuModule,
      imports: [HttpModule, LoggerModule.forRoot({ context: options.context })],
      providers: [
        {
          provide: MAMBU_CLIENT,
          useValue: options,
        },
        ...providers,
        ...customProviders,
      ],
      exports: [...providers, ...customProviders],
    };
  }
}
