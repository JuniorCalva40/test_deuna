import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { GetCommissionPayoutPreviewService } from './query-get-commission-payout-preview.service';
import { GetCommissionPayoutPreviewInput } from '../dto/get-commission-payout-preview.input.dto';
import { IMsaTlDigisignInvoiceService } from '../../../external-services/msa-tl-digisign-invoice/interfaces/imsa-tl-digisign-invoice-service.interface';
import { MSA_TL_DIGISIGN_INVOICE_SERVICE } from '../../../external-services/msa-tl-digisign-invoice/providers/msa-tl-digisign-invoice.provider';
import { IMsaMcCrCommissionsService } from '../../../external-services/deuna-msa-mc-cr-commissions/interfaces/deuna-msa-mc-cr-commissions.interface';
import { MSA_CR_COMMISIONS_SERVICE } from '../../../external-services/deuna-msa-mc-cr-commissions/providers/deuna-msa-mc-cr-commissions.provider';
import {
  TAX_REGIMES,
  VAT_RATES,
} from '../../../common/constants/tax-regime.constants';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';

jest.mock('../../../utils/error-handler.util', () => ({
  ErrorHandler: {
    handleError: jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    }),
  },
}));

describe('GetCommissionPayoutPreviewService', () => {
  let service: GetCommissionPayoutPreviewService;
  let mockDigisignInvoiceService: jest.Mocked<IMsaTlDigisignInvoiceService>;
  let mockCommissionsService: jest.Mocked<IMsaMcCrCommissionsService>;

  const mockRucInfoResponse = {
    data: {
      main: [
        {
          numeroRuc: '1234567890001',
          razonSocial: 'Test Business',
          regimen: TAX_REGIMES.GENERAL,
        },
      ],
    },
  };

  const mockCommissionsResponse = {
    commissions: [{ amount: 50 }, { amount: 50 }],
  };

  const input: GetCommissionPayoutPreviewInput = {
    identification: '1234567890',
    merchantId: 'merchant-123',
    sessionId: 'session-id',
    requestId: 'request-id',
    trackingId: 'tracking-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCommissionPayoutPreviewService,
        {
          provide: MSA_TL_DIGISIGN_INVOICE_SERVICE,
          useValue: {
            getRucInformation: jest.fn(),
          },
        },
        {
          provide: MSA_CR_COMMISIONS_SERVICE,
          useValue: {
            searchCommissions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GetCommissionPayoutPreviewService>(
      GetCommissionPayoutPreviewService,
    );
    mockDigisignInvoiceService = module.get(MSA_TL_DIGISIGN_INVOICE_SERVICE);
    mockCommissionsService = module.get(MSA_CR_COMMISIONS_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCommissionPayoutPreview', () => {
    it('should calculate payout preview correctly for a standard tax regime', async () => {
      mockDigisignInvoiceService.getRucInformation.mockResolvedValue(
        mockRucInfoResponse as any,
      );
      mockCommissionsService.searchCommissions.mockReturnValue(
        of(mockCommissionsResponse as any),
      );

      const result = await service.getCommissionPayoutPreview(input);

      const subtotal = 100;
      const taxRate = VAT_RATES[TAX_REGIMES.GENERAL];
      const taxAmount = subtotal * taxRate;
      const netAmount = subtotal - taxAmount;

      expect(result.prepareCommissionPayout.subtotalAmount).toBe(subtotal);
      expect(result.prepareCommissionPayout.taxDetails.rate).toBe(taxRate);
      expect(result.prepareCommissionPayout.taxDetails.amount).toBe(taxAmount);
      expect(result.prepareCommissionPayout.netPayoutAmount).toBe(netAmount);
      expect(mockDigisignInvoiceService.getRucInformation).toHaveBeenCalled();
      expect(mockCommissionsService.searchCommissions).toHaveBeenCalled();
    });

    it('should handle error when fetching RUC information', async () => {
      const error = new Error('RUC service failure');
      mockDigisignInvoiceService.getRucInformation.mockRejectedValue(error);

      await expect(
        service.getCommissionPayoutPreview(input),
      ).rejects.toThrow('Test error');
    });

    it('should handle error if ruc information main data is missing', async () => {
      mockDigisignInvoiceService.getRucInformation.mockResolvedValue({
        data: { main: null },
      } as any);

      await expect(
        service.getCommissionPayoutPreview(input),
      ).rejects.toThrow('Test error');
    });

    it('should handle error from commissions service', async () => {
      mockDigisignInvoiceService.getRucInformation.mockResolvedValue(
        mockRucInfoResponse as any,
      );
      mockCommissionsService.searchCommissions.mockReturnValue(
        throwError(() => new Error('Commissions service failure')),
      );

      await expect(
        service.getCommissionPayoutPreview(input),
      ).rejects.toThrow('Test error');
    });

    it('should handle missing commissions in the response', async () => {
      mockDigisignInvoiceService.getRucInformation.mockResolvedValue(
        mockRucInfoResponse as any,
      );
      mockCommissionsService.searchCommissions.mockReturnValue(of({} as any));

      await expect(
        service.getCommissionPayoutPreview(input),
      ).rejects.toThrow('Test error');
    });

    it('should handle an unknown tax regime and default to 0 tax', async () => {
      const rucInfoUnknownRegime = JSON.parse(
        JSON.stringify(mockRucInfoResponse),
      );
      rucInfoUnknownRegime.data.main[0].regimen = 'UNKNOWN_REGIME';
      mockDigisignInvoiceService.getRucInformation.mockResolvedValue(
        rucInfoUnknownRegime as any,
      );
      mockCommissionsService.searchCommissions.mockReturnValue(
        of(mockCommissionsResponse as any),
      );

      const result = await service.getCommissionPayoutPreview(input);

      expect(result.prepareCommissionPayout.taxDetails.rate).toBe(0);
      expect(result.prepareCommissionPayout.taxDetails.amount).toBe(0);
      expect(result.prepareCommissionPayout.netPayoutAmount).toBe(100);
    });
  });
});
