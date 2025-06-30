import { Injectable, Inject, Logger } from '@nestjs/common';
import { DataResponse } from '../dto/response.dto';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-client/providers/msa-nb-client-service.provider';
import { IMsaNbClientService } from '../../../external-services/msa-nb-client/interfaces/msa-nb-client-service.interface';
import { MSA_CO_COMMERCE_SERVICE } from '../../../external-services/msa-co-commerce/providers/msa-co-commerce-provider';
import { IMsaCoCommerceService } from '../../../external-services/msa-co-commerce/interfaces/msa-co-commerce-service.interface';
import { lastValueFrom } from 'rxjs';
import { ErrorHandler } from '../../../utils/error-handler.util';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @Inject(MSA_NB_CLIENT_SERVICE) private clientService: IMsaNbClientService,
    @Inject(MSA_CO_COMMERCE_SERVICE)
    private commerceService: IMsaCoCommerceService,
  ) {}

  async validateCnbState(username: string): Promise<DataResponse> {
    try {
      // Obtiene el usuario por username usando el servicio de comercio
      const user = await lastValueFrom(
        this.commerceService.getUserByUsername(username),
      );

      if (!user) {
        return {
          status: 'ERROR',
          cnbState: 'NOT_FOUND',
          errors: [
            { code: 'USER_NOT_FOUND', message: 'Usuario no encontrado' },
          ],
        };
      }

      // Obtiene el cliente por identificación
      const client = await lastValueFrom(
        this.clientService.getClientByIdentification(user.identification),
      );

      if (!client) {
        return ErrorHandler.handleError(
          'Client not found',
          'validate-cnb-state',
        );
      }

      // Valida el estado del cliente
      const isPrecalificate = client.status === 'PRECALIFICADO';

      return {
        status: 'SUCCESS',
        cnbState: client.status,
        errors: isPrecalificate
          ? undefined
          : [{ code: 'NOT_PRECALIFIED', message: 'Cliente no precalificado' }],
      };
    } catch (error) {
      return ErrorHandler.handleError(error, 'validate-cnb-state');
    }
  }
}
