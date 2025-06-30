import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { GenerateCommissionInvoiceService } from './generate-commission-invoice.service';
import { GenerateCommissionInvoiceInput } from '../dto/generate-commission-invoice.input.dto';
import { MSA_TL_DIGISIGN_INVOICE_SERVICE } from '../../../external-services/msa-tl-digisign-invoice/providers/msa-tl-digisign-invoice.provider';
import { MSA_CR_COMMISIONS_SERVICE } from '../../../external-services/deuna-msa-mc-cr-commissions/providers/deuna-msa-mc-cr-commissions.provider';
import { MSA_MC_BO_CLIENT_SERVICE } from '../../../external-services/msa-mc-bo-client/providers/msa-mc-bo-client.provider';
import { MSA_MC_BO_HIERARCHY_SERVICE } from '../../../external-services/msa-mc-bo-hierarchy/providers/msa-mc-bo-hierarchy.provider';
import { MSA_MC_BO_CONFIGURATION_SERVICE } from '../../../external-services/msa-mc-bo-configuration/providers/msa-mc-bo-configuration.provider';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { VAT_RATES } from '../../../common/constants/tax-regime.constants';

jest.mock('../../../utils/error-handler.util');

describe('GenerateCommissionInvoiceService', () => {
  let service: GenerateCommissionInvoiceService;

  const mockMsaTlDigisignInvoiceService = {
    getRucInformation: jest.fn(),
    createInvoice: jest.fn(),
  };
  const mockMsaCrCommissionsService = {
    searchCommissions: jest.fn(),
  };
  const mockClientServiceMc = {
    getClientData: jest.fn(),
  };
  const mockHierarchyService = {
    getHierarchyNodes: jest.fn(),
  };
  const mockConfigurationService = {
    getConfigCnbAddress: jest.fn(),
  };

  const mockInput: GenerateCommissionInvoiceInput = {
    identification: '1234567890',
    merchantId: 'merchant-123',
    comercialName: 'Test Store',
    sessionId: 'session-id',
    requestId: 'request-id',
    trackingId: 'tracking-id',
  };

  const mockClientCnb = { id: 'client-id-123', email: 'test@example.com' };
  const mockNodes = { items: [{ id: 'node-123' }] };
  const mockConfigAddress = {
    configData: {
      contribuyenteEspecial: 'NO',
      addit: [
        {
          tipoEstablecimiento: '001',
          numeroEstablecimiento: '002',
          direccionCompleta: '123 Main St',
        },
      ],
    },
  };
  const mockRucInfo = {
    data: {
      main: [
        {
          razonSocial: 'Test Razon Social',
          numeroRuc: '1234567890001',
          regimen: 'REGIMEN GENERAL',
        },
      ],
    },
  };
  const mockCommissions = {
    commissions: [{ amount: 100 }, { amount: 150 }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateCommissionInvoiceService,
        {
          provide: MSA_TL_DIGISIGN_INVOICE_SERVICE,
          useValue: mockMsaTlDigisignInvoiceService,
        },
        {
          provide: MSA_CR_COMMISIONS_SERVICE,
          useValue: mockMsaCrCommissionsService,
        },
        {
          provide: MSA_MC_BO_CLIENT_SERVICE,
          useValue: mockClientServiceMc,
        },
        {
          provide: MSA_MC_BO_HIERARCHY_SERVICE,
          useValue: mockHierarchyService,
        },
        {
          provide: MSA_MC_BO_CONFIGURATION_SERVICE,
          useValue: mockConfigurationService,
        },
      ],
    }).compile();

    service = module.get<GenerateCommissionInvoiceService>(
      GenerateCommissionInvoiceService,
    );

    // Reset mocks before each test
    jest.clearAllMocks();

    // Default happy path mocks
    mockClientServiceMc.getClientData.mockReturnValue(of(mockClientCnb));
    mockHierarchyService.getHierarchyNodes.mockReturnValue(of(mockNodes));
    mockConfigurationService.getConfigCnbAddress.mockReturnValue(
      of(mockConfigAddress),
    );
    mockMsaTlDigisignInvoiceService.getRucInformation.mockResolvedValue(
      mockRucInfo,
    );
    mockMsaCrCommissionsService.searchCommissions.mockReturnValue(
      of(mockCommissions),
    );
    mockMsaTlDigisignInvoiceService.createInvoice.mockResolvedValue({
      message: 'Success',
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCommissionInvoice', () => {
    it('should successfully generate an invoice', async () => {
      const result = await service.generateCommissionInvoice(mockInput);

      expect(mockClientServiceMc.getClientData).toHaveBeenCalledWith({
        identification: mockInput.identification,
      });
      expect(mockHierarchyService.getHierarchyNodes).toHaveBeenCalledWith(
        mockClientCnb.id,
      );
      expect(mockConfigurationService.getConfigCnbAddress).toHaveBeenCalledWith(
        mockNodes.items[0].id,
      );
      const rucNumber = `${mockInput.identification}001`;
      expect(
        mockMsaTlDigisignInvoiceService.getRucInformation,
      ).toHaveBeenCalledWith(rucNumber, expect.any(Object));
      expect(
        mockMsaCrCommissionsService.searchCommissions,
      ).toHaveBeenCalledWith(
        mockInput.merchantId,
        { page: 1, size: 10 },
        expect.any(String),
        expect.any(String),
      );

      const subtotal = 250;
      const taxRate = VAT_RATES['REGIMEN GENERAL'] ?? 0;
      const taxAmount = subtotal * taxRate;
      const expectedInvoicePayload = {
        infoTributaria: {
          razonSocial: mockRucInfo.data.main[0].razonSocial,
          nombreComercial: mockInput.comercialName,
          ruc: rucNumber,
          codigoDocumento: '01',
          establecimiento:
            mockConfigAddress.configData.addit[0].tipoEstablecimiento,
          puntoEmision:
            mockConfigAddress.configData.addit[0].numeroEstablecimiento,
          secuencial: '0001',
          direccionMatriz:
            mockConfigAddress.configData.addit[0].direccionCompleta,
        },
        infoFactura: {
          contribuyenteEspecial:
            mockConfigAddress.configData.contribuyenteEspecial,
          totalSinImpuestos: subtotal,
          totalDescuento: 0,
          totalConImpuestos: [
            {
              codigo: 2,
              codigoPorcentaje: 4,
              baseImponible: subtotal,
              valor: taxAmount,
            },
          ],
          importeTotal: subtotal,
          pagos: [{ total: subtotal }],
        },
        detalles: [
          {
            precioUnitario: subtotal,
            descuento: 0,
            precioTotalSinImpuesto: subtotal,
            tarifa: taxRate,
            baseImponible: subtotal,
            valor: taxAmount,
          },
        ],
        infoAdicional: [{ descripcion: mockClientCnb.email }],
      };
      expect(
        mockMsaTlDigisignInvoiceService.createInvoice,
      ).toHaveBeenCalledWith(expectedInvoicePayload, expect.any(Object));

      expect(result).toEqual({
        message: 'Success',
        status: 'SUCCESS',
      });
    });

    it('should handle error when fetching client data fails', async () => {
      const testError = new Error('Client Service Error');
      mockClientServiceMc.getClientData.mockReturnValue(
        throwError(() => testError),
      );

      await expect(
        service.generateCommissionInvoice(mockInput),
      ).rejects.toThrow(testError);

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        'Error fetching client data',
        ErrorCodes.CNB_SERVICE_ERROR,
      );
    });

    it('should handle error when client is not found', async () => {
      mockClientServiceMc.getClientData.mockReturnValue(of(null));
      await service.generateCommissionInvoice(mockInput);
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        'Client not found',
        ErrorCodes.CNB_CLIENT_NOT_FOUND,
      );
    });

    it('should handle error when fetching nodes fails', async () => {
      const testError = new Error('Hierarchy Service Error');
      mockHierarchyService.getHierarchyNodes.mockReturnValue(
        throwError(() => testError),
      );

      await expect(
        service.generateCommissionInvoice(mockInput),
      ).rejects.toThrow(testError);

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        'Error fetching nodes',
        ErrorCodes.CNB_SERVICE_ERROR,
      );
    });

    it('should handle error when fetching config address fails', async () => {
      const testError = new Error('Config Service Error');
      mockConfigurationService.getConfigCnbAddress.mockReturnValue(
        throwError(() => testError),
      );

      await expect(
        service.generateCommissionInvoice(mockInput),
      ).rejects.toThrow(testError);

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        'Error fetching config client address',
        ErrorCodes.CNB_CONFIG_ADDRESS_ERROR,
      );
    });

    it('should handle error when address is missing', async () => {
      mockConfigurationService.getConfigCnbAddress.mockReturnValue(
        of({ configData: null }),
      );
      await service.generateCommissionInvoice(mockInput);
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        'Invalid cnb address list, the address is missing',
        ErrorCodes.CNB_CLIENT_INVALID_ADDRESS,
      );
    });

    it('should handle error when fetching RUC information fails', async () => {
      const testError = new Error('RUC Service Error');
      mockMsaTlDigisignInvoiceService.getRucInformation.mockRejectedValue(
        testError,
      );

      await expect(
        service.generateCommissionInvoice(mockInput),
      ).rejects.toThrow(testError);

      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        'Error fetching ruc information',
        ErrorCodes.MSA_TL_DIGISIGN_INVOICE_RUC_INFORMATION_NOT_FOUND,
      );
    });

    it('should handle error when RUC information is not found', async () => {
      mockMsaTlDigisignInvoiceService.getRucInformation.mockResolvedValue(null);
      await service.generateCommissionInvoice(mockInput);
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        'RUC information not found',
        ErrorCodes.MSA_TL_DIGISIGN_INVOICE_RUC_INFORMATION_NOT_FOUND,
      );
    });

    it('should handle error when invoice generation fails', async () => {
      mockMsaTlDigisignInvoiceService.createInvoice.mockResolvedValue(null);
      await service.generateCommissionInvoice(mockInput);
      expect(ErrorHandler.handleError).toHaveBeenCalledWith(
        'Error generating invoice',
        ErrorCodes.MSA_TL_DIGISIGN_INVOICE_CREATE_INVOICE_ERROR,
      );
    });
  });
});
