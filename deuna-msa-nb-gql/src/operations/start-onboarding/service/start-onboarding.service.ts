import { Injectable, Inject, Logger } from '@nestjs/common';
import { StartOnboardingResponse } from '../dto/start-onboarding-response.dto';
import { IMsaCoCommerceService } from 'src/external-services/msa-co-commerce/interfaces/msa-co-commerce-service.interface';
import { lastValueFrom } from 'rxjs';
import { IMsaNbClientService } from 'src/external-services/msa-nb-client/interfaces/msa-nb-client-service.interface';
import { IMsaCoOnboardingStatusService } from 'src/external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { EstablishmentOutputDto } from 'src/utils/establishment.dto';

@Injectable()
export class StartOnboardingService {
  private readonly logger = new Logger(StartOnboardingService.name);

  constructor(
    @Inject('MSA_CO_COMMERCE_SERVICE')
    private readonly msaCoCommerceService: IMsaCoCommerceService,
    @Inject('MSA_NB_CLIENT_SERVICE')
    private readonly msaNbClientService: IMsaNbClientService,
    @Inject('MSA_CO_ONBOARDING_STATE_SERVICE')
    private readonly msaCoOnboardingStatusService: IMsaCoOnboardingStatusService,
  ) {}

  async startOnboarding(
    username: string,
    email: string,
  ): Promise<StartOnboardingResponse> {
    try {
      const getMerchantDataByUsernameResponse = await lastValueFrom(
        this.msaCoCommerceService.getUserByUsername(username),
      );

      if (!getMerchantDataByUsernameResponse) {
        return ErrorHandler.handleError(
          'Failed to get merchant data by username',
          'start-onboarding',
        );
      }

      const getCbnByDocResponse = await lastValueFrom(
        this.msaNbClientService.getClientByIdentification(
          getMerchantDataByUsernameResponse.identification,
        ),
      );

      if (!getCbnByDocResponse.id) {
        return ErrorHandler.handleError('Client not found', 'start-onboarding');
      }

      const updateCnbCommerceIdResponse = await lastValueFrom(
        this.msaNbClientService.updateClientComerceId(
          getCbnByDocResponse.id,
          getMerchantDataByUsernameResponse.comerceId,
        ),
      );

      if (!updateCnbCommerceIdResponse) {
        return ErrorHandler.handleError(
          'Failed to update client comerce id',
          'start-onboarding',
        );
      }

      const initOnboardingResponse = await lastValueFrom(
        this.msaCoOnboardingStatusService.initOnboarding({
          identityId: getMerchantDataByUsernameResponse.identification,
          onbType: 'onb_cnb',
          securitySeed: '5fd924625f6ab16a1',
          publicKey:
            '5fd924625f6ab16a19cc9807c7c506ae1813490e4ba675f843d5a10e0baacdb8',
        }),
      );

      if (!initOnboardingResponse.sessionId) {
        return ErrorHandler.handleError(
          'Failed to initialize onboarding process',
          'start-onboarding',
        );
      }

      // Extract active establishments from RUC details
      const activeEstablishments: EstablishmentOutputDto[] =
        getMerchantDataByUsernameResponse.ruc?.result.addit
          .filter((est) => est.estado === 'ABIERTO')
          .map((est) => ({
            fullAddress: est.direccionCompleta,
            numberEstablishment: est.numeroEstablecimiento,
          })) || [];

      // Convert RUC string to number, removing any non-digit characters
      const rucNumber = getMerchantDataByUsernameResponse.ruc?.result.numeroRuc
        ? parseInt(
            getMerchantDataByUsernameResponse.ruc.result.numeroRuc.replace(
              /\D/g,
              '',
            ),
            10,
          )
        : 0;

      const startOnboardingResponse = await lastValueFrom(
        this.msaCoOnboardingStatusService.startOnboarding({
          sessionId: initOnboardingResponse.sessionId,
          status: 'SUCCESS',
          data: {
            cnbClientId: getCbnByDocResponse.id,
            companyName:
              getMerchantDataByUsernameResponse?.ruc?.result.razonSocial,
            ruc: rucNumber,
            email: email,
            establishment: activeEstablishments,
            fullName: getMerchantDataByUsernameResponse.fullName,
            phoneNumber: getMerchantDataByUsernameResponse.principalContact,
          },
        }),
      );

      if (!startOnboardingResponse) {
        return ErrorHandler.handleError(
          'Failed to start onboarding process',
          'start-onboarding',
        );
      }

      // TODO: Remover los campos que no se necesitan
      const dataStartOnboardingResponse: StartOnboardingResponse = {
        sessionId: initOnboardingResponse.sessionId,
        establishments: activeEstablishments,
        status: 'SUCCESS',
      };

      return dataStartOnboardingResponse;
    } catch (error) {
      return ErrorHandler.handleError(error, 'start-onboarding');
    }
  }
}
