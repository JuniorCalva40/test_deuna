import { Inject, Injectable } from '@nestjs/common';
import { Logger } from '@deuna/tl-logger-nd';
import { formatLogger } from '../../../utils/format-logger';
import { GetCommissionPayoutPreviewInput } from '../dto/get-commission-payout-preview.input.dto';
import { GetCommissionPayoutPreviewResponseDto } from '../dto/get-commission-payout-preview.response.dto';
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
import { formatPayoutReasonFromMonth } from '../../../utils/date-formatter.util';

@Injectable()
export class GetCommissionPayoutPreviewService {
  private readonly logger = new Logger({
    context: GetCommissionPayoutPreviewService.name,
  });

  constructor(
    @Inject(MSA_TL_DIGISIGN_INVOICE_SERVICE)
    private readonly digisignInvoiceService: IMsaTlDigisignInvoiceService,
    @Inject(MSA_CR_COMMISIONS_SERVICE)
    private readonly commissionsService: IMsaMcCrCommissionsService,
  ) {}

  async getCommissionPayoutPreview(
    input: GetCommissionPayoutPreviewInput,
  ): Promise<GetCommissionPayoutPreviewResponseDto> {
    const { identification, sessionId, trackingId, requestId, merchantId } =
      input;

    formatLogger(
      this.logger,
      'info',
      `Fetching RUC information for identification: ${identification}`,
      sessionId,
      trackingId,
      requestId,
    );

    const rucNumber = `${input.identification}001`;

    const rucInformationResponse = await this.digisignInvoiceService
      .getRucInformation(rucNumber, {
        [TrackingApiHeaders.SESSION_ID]: sessionId,
        [TrackingApiHeaders.REQUEST_ID]: requestId,
        [TrackingApiHeaders.TRACKING_ID]: trackingId,
      })
      .catch((error) => {
        formatLogger(
          this.logger,
          'error',
          `Error fetching RUC information for identification ${identification}, ruc number: ${rucNumber}: ${error}`,
          sessionId,
          trackingId,
          requestId,
        );
        ErrorHandler.handleError(
          'Error fetching RUC information',
          ErrorCodes.MSA_TL_DIGISIGN_INVOICE_RUC_INFORMATION_NOT_FOUND,
        );
      });

    if (!rucInformationResponse?.data?.main?.[0]) {
      ErrorHandler.handleError(
        'RUC information not found or is invalid',
        ErrorCodes.MSA_TL_DIGISIGN_INVOICE_RUC_INFORMATION_NOT_FOUND,
      );
    }

    const rucMainInfo = rucInformationResponse.data.main[0];

    formatLogger(
      this.logger,
      'info',
      `Successfully fetched RUC information for identification: ${identification}, ruc number: ${rucNumber}`,
      sessionId,
      trackingId,
      requestId,
    );

    let startMonthRequest = new Date().toISOString().split('T')[0];
    let endMonthRequest = new Date().toISOString().split('T')[0];
    startMonthRequest =
      startMonthRequest.split('-')[0] + '-' + startMonthRequest.split('-')[1];
    endMonthRequest =
      endMonthRequest.split('-')[0] + '-' + endMonthRequest.split('-')[1];

    const commissionsResponse = await lastValueFrom(
      this.commissionsService.searchCommissions(
        merchantId,
        {
          page: PAGINATION_COMMISSION_DTO.page,
          size: PAGINATION_COMMISSION_DTO.size,
        },
        startMonthRequest,
        endMonthRequest,
      ),
    ).catch((error) => {
      formatLogger(
        this.logger,
        'error',
        `Error fetching commissions for merchant ${merchantId}: ${error}`,
        sessionId,
        trackingId,
        requestId,
      );
      ErrorHandler.handleError(
        'Error fetching commissions',
        ErrorCodes.CNB_SERVICE_ERROR,
      );
    });

    if (!commissionsResponse?.commissions) {
      ErrorHandler.handleError(
        'Commissions data not found or is invalid',
        ErrorCodes.CNB_SERVICE_ERROR,
      );
    }

    const subtotalAmount = commissionsResponse.commissions.reduce(
      (sum, commission) => sum + commission.amount,
      0,
    );

    const taxRegime = rucMainInfo.regimen?.toUpperCase();
    const vatRate = VAT_RATES[taxRegime] ?? 0.0;
    const taxAmount = subtotalAmount * vatRate;
    const netPayoutAmount = subtotalAmount - taxAmount;
    const payoutReason = formatPayoutReasonFromMonth();

    return {
      prepareCommissionPayout: {
        subtotalAmount,
        taxDetails: {
          rate: vatRate,
          amount: taxAmount,
        },
        netPayoutAmount,
        payoutReason,
        currency: 'USD',
        destinationAccount: {
          name: rucMainInfo.razonSocial,
          ruc: rucMainInfo.numeroRuc,
        },
      },
      status: 'SUCCESS',
    };
  }
}
