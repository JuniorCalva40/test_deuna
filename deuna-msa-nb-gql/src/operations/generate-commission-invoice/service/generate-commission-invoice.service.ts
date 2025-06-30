import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { formatLogger } from '../../../utils/format-logger';
import { GenerateCommissionInvoiceInput } from '../dto/generate-commission-invoice.input.dto';
import { GenerateCommissionInvoiceResponseDto } from '../dto/generate-commission-invoice.response.dto';
import { IMsaTlDigisignInvoiceService } from '../../../external-services/msa-tl-digisign-invoice/interfaces/imsa-tl-digisign-invoice-service.interface';
import { MSA_TL_DIGISIGN_INVOICE_SERVICE } from '../../../external-services/msa-tl-digisign-invoice/providers/msa-tl-digisign-invoice.provider';
import {
  PAGINATION_COMMISSION_DTO,
  TrackingApiHeaders,
} from '../../../common/constants/common';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { VAT_RATES } from '../../../common/constants/tax-regime.constants';
import { MSA_CR_COMMISIONS_SERVICE } from '../../../external-services/deuna-msa-mc-cr-commissions/providers/deuna-msa-mc-cr-commissions.provider';
import { IMsaMcCrCommissionsService } from '../../../external-services/deuna-msa-mc-cr-commissions/interfaces/deuna-msa-mc-cr-commissions.interface';
import { lastValueFrom } from 'rxjs';
import { MSA_MC_BO_CLIENT_SERVICE } from '../../../external-services/msa-mc-bo-client/providers/msa-mc-bo-client.provider';
import { IMsaMcBoClientService } from '../../../external-services/msa-mc-bo-client/interfaces/msa-mc-bo-client.interface';
import { v4 as uuidv4 } from 'uuid';
import { IMsaMcBoHierarchyService } from '../../../external-services/msa-mc-bo-hierarchy/interfaces/msa-mc-bo-hierarchy-service.interface';
import { MSA_MC_BO_HIERARCHY_SERVICE } from '../../../external-services/msa-mc-bo-hierarchy/providers/msa-mc-bo-hierarchy.provider';
import { McBoConfigCnbAddressDto } from '../../../external-services/msa-mc-bo-configuration/dto/get-config-cnb-address.dto';
import { IMsaMcBoConfigurationService } from '../../../external-services/msa-mc-bo-configuration/interfaces/msa-mc-bo-configuration-service.interface';
import { MSA_MC_BO_CONFIGURATION_SERVICE } from '../../../external-services/msa-mc-bo-configuration/providers/msa-mc-bo-configuration.provider';

@Injectable()
export class GenerateCommissionInvoiceService {
  private readonly logger = new Logger({
    context: GenerateCommissionInvoiceService.name,
  });

  constructor(
    @Inject(MSA_TL_DIGISIGN_INVOICE_SERVICE)
    private readonly msaTlDigisignInvoiceService: IMsaTlDigisignInvoiceService,
    @Inject(MSA_CR_COMMISIONS_SERVICE)
    private readonly msaCrCommissionsService: IMsaMcCrCommissionsService,
    @Inject(MSA_MC_BO_CLIENT_SERVICE)
    private clientServiceMc: IMsaMcBoClientService,
    @Inject(MSA_MC_BO_HIERARCHY_SERVICE)
    private hierarchyService: IMsaMcBoHierarchyService,
    @Inject(MSA_MC_BO_CONFIGURATION_SERVICE)
    private configurationService: IMsaMcBoConfigurationService,
  ) {}

  async generateCommissionInvoice(
    input: GenerateCommissionInvoiceInput,
  ): Promise<GenerateCommissionInvoiceResponseDto> {
    formatLogger(
      this.logger,
      'info',
      `Starting get client-mc by identification ${input.identification} into msa-bo-mc-client`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );
    const clientCnb = await lastValueFrom(
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
      throw error;
    });

    formatLogger(
      this.logger,
      'info',
      `Finished get client-mc by identification ${input.identification} into msa-bo-mc-client`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );
    if (!clientCnb) {
      ErrorHandler.handleError(
        'Client not found',
        ErrorCodes.CNB_CLIENT_NOT_FOUND,
      );
      return;
    }

    input.requestId = uuidv4();

    formatLogger(
      this.logger,
      'info',
      `Starting get nodes into msa-co-hierarchy for clientCnb ${clientCnb.id}`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );
    // Get nodes into msa-co-hierarchy
    const nodes = await lastValueFrom(
      this.hierarchyService.getHierarchyNodes(clientCnb.id),
    ).catch((error) => {
      formatLogger(
        this.logger,
        'error',
        `Error received in service msa-co-hierarchy for clientCnb ${clientCnb.id}: ${error}`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );
      ErrorHandler.handleError(
        'Error fetching nodes',
        ErrorCodes.CNB_SERVICE_ERROR,
      );
      throw error;
    });

    formatLogger(
      this.logger,
      'info',
      `Finished get nodes into msa-co-hierarchy for clientCnb ${clientCnb.id}`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );
    const nodeId = nodes.items[0].id.toString();

    input.requestId = uuidv4();
    formatLogger(
      this.logger,
      'info',
      `Starting get config cnb address into msa-mc-bo-configuration for nodeId ${nodeId}`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );
    // Get node configuration into msa-mc-bo-configuration
    const getConfigCnbRucInfo: McBoConfigCnbAddressDto = await lastValueFrom(
      this.configurationService.getConfigCnbAddress(nodeId),
    ).catch((error) => {
      formatLogger(
        this.logger,
        'error',
        `Error received in service msa-mc-bo-configuration for nodeId ${nodeId}: ${error}`,
        input.sessionId,
        input.trackingId,
        input.requestId,
      );
      ErrorHandler.handleError(
        'Error fetching config client address',
        ErrorCodes.CNB_CONFIG_ADDRESS_ERROR,
      );
      throw error;
    });

    formatLogger(
      this.logger,
      'info',
      `Finished get config cnb address into msa-mc-bo-configuration for nodeId ${nodeId}`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );

    const additAddress = getConfigCnbRucInfo.configData?.addit;

    if (!additAddress) {
      ErrorHandler.handleError(
        'Invalid cnb address list, the address is missing',
        ErrorCodes.CNB_CLIENT_INVALID_ADDRESS,
      );
      return;
    }
    formatLogger(
      this.logger,
      'info',
      `Starting get ruc information for identification ${input.identification} into msa-tl-digisign-invoice-service`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );

    const rucNumberInvoice = `${input.identification}001`;
    const rucInformation = await this.msaTlDigisignInvoiceService
      .getRucInformation(rucNumberInvoice, {
        [TrackingApiHeaders.SESSION_ID]: input.sessionId,
        [TrackingApiHeaders.REQUEST_ID]: input.requestId,
        [TrackingApiHeaders.TRACKING_ID]: input.trackingId,
      })
      .catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error received in service msa-tl-digisign-invoice-service getRucInformation for identification ${input.identification}: ${error}`,
          input.sessionId,
          input.trackingId,
          input.requestId,
        );
        ErrorHandler.handleError(
          'Error fetching ruc information',
          ErrorCodes.MSA_TL_DIGISIGN_INVOICE_RUC_INFORMATION_NOT_FOUND,
        );
        throw error;
      });

    if (!rucInformation) {
      ErrorHandler.handleError(
        'RUC information not found',
        ErrorCodes.MSA_TL_DIGISIGN_INVOICE_RUC_INFORMATION_NOT_FOUND,
      );
      return;
    }

    const rucInformationData = rucInformation.data;
    formatLogger(
      this.logger,
      'info',
      `Successfully fetched RUC information: ${JSON.stringify(
        rucInformationData,
      )}`,
      input.sessionId,
      input.trackingId,
      input.requestId,
    );

    let startMonthRequest = new Date().toISOString().split('T')[0];
    let endMonthRequest = new Date().toISOString().split('T')[0];
    startMonthRequest =
      startMonthRequest.split('-')[0] + '-' + startMonthRequest.split('-')[1];
    endMonthRequest =
      endMonthRequest.split('-')[0] + '-' + endMonthRequest.split('-')[1];

    const commissionsResponse = await lastValueFrom(
      this.msaCrCommissionsService.searchCommissions(
        input.merchantId,
        {
          page: PAGINATION_COMMISSION_DTO.page,
          size: PAGINATION_COMMISSION_DTO.size,
        },
        startMonthRequest,
        endMonthRequest,
      ),
    );

    const subtotalAmount = commissionsResponse.commissions.reduce(
      (acc, commission) => acc + commission.amount,
      0,
    );

    // Calculate tax based on the establishment type (tax regime).
    const taxRegime = rucInformationData.main[0].regimen?.toUpperCase();
    const vatRate = VAT_RATES[taxRegime] ?? 0.0; // Default to 0 if regime not in our rules.

    const taxAmount = subtotalAmount * vatRate;

    const generateInvoiceResponse =
      await this.msaTlDigisignInvoiceService.createInvoice(
        {
          infoTributaria: {
            razonSocial: rucInformationData.main[0].razonSocial,
            nombreComercial: input.comercialName,
            ruc: rucInformationData.main[0].numeroRuc,
            codigoDocumento: '01',
            establecimiento: additAddress[0].tipoEstablecimiento,
            puntoEmision: additAddress[0].numeroEstablecimiento,
            secuencial: '0001', // pendiente por implementar
            direccionMatriz: additAddress[0].direccionCompleta,
          },
          infoFactura: {
            contribuyenteEspecial:
              getConfigCnbRucInfo.configData.contribuyenteEspecial,
            totalSinImpuestos: subtotalAmount,
            totalDescuento: 0,
            totalConImpuestos: [
              {
                codigo: 2,
                codigoPorcentaje: 4,
                baseImponible: subtotalAmount,
                valor: taxAmount,
              },
            ],
            importeTotal: subtotalAmount,
            pagos: [
              {
                total: subtotalAmount,
              },
            ],
          },
          detalles: [
            {
              precioUnitario: subtotalAmount,
              descuento: 0,
              precioTotalSinImpuesto: subtotalAmount,
              tarifa: vatRate,
              baseImponible: subtotalAmount,
              valor: taxAmount,
            },
          ],
          infoAdicional: [
            {
              descripcion: clientCnb.email ?? '',
            },
          ],
        },
        {
          [TrackingApiHeaders.SESSION_ID]: input.sessionId,
          [TrackingApiHeaders.REQUEST_ID]: input.requestId,
          [TrackingApiHeaders.TRACKING_ID]: input.trackingId,
        },
      );

    if (!generateInvoiceResponse) {
      ErrorHandler.handleError(
        'Error generating invoice',
        ErrorCodes.MSA_TL_DIGISIGN_INVOICE_CREATE_INVOICE_ERROR,
      );
      return;
    }
    return {
      message: generateInvoiceResponse.message,
      status: 'SUCCESS',
    };
  }
}
