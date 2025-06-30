import { Test, TestingModule } from '@nestjs/testing';
import { GenerateCommissionInvoiceResolver } from './generate-commission-invoice.resolver';
import { GenerateCommissionInvoiceService } from './service/generate-commission-invoice.service';
import { GenerateCommissionInvoiceResponseDto } from './dto/generate-commission-invoice.response.dto';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';

describe('GenerateCommissionInvoiceResolver', () => {
  let resolver: GenerateCommissionInvoiceResolver;
  let service: GenerateCommissionInvoiceService;

  const mockGenerateCommissionInvoiceService = {
    generateCommissionInvoice: jest.fn(),
  };

  const mockCustomerInfo: ClientInfo = {
    id: 'test-id',
    identification: '1234567890',
    identificationType: 'RUC',
    businessName: 'Test Business Name',
    comercialName: 'Test Commercial Name',
    status: 'ACTIVE',
    coordinator: 'Test Coordinator',
  };

  const mockContext = {
    req: {
      headers: {
        'client-info': mockCustomerInfo,
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateCommissionInvoiceResolver,
        {
          provide: GenerateCommissionInvoiceService,
          useValue: mockGenerateCommissionInvoiceService,
        },
      ],
    })
      .overrideGuard(ValidationAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetClientGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<GenerateCommissionInvoiceResolver>(
      GenerateCommissionInvoiceResolver,
    );
    service = module.get<GenerateCommissionInvoiceService>(
      GenerateCommissionInvoiceService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('generateCommissionInvoice', () => {
    it('should call the service and return the result', async () => {
      const expectedResponse: GenerateCommissionInvoiceResponseDto = {
        message: 'Invoice generated successfully',
        status: 'SUCCESS',
      };

      mockGenerateCommissionInvoiceService.generateCommissionInvoice.mockResolvedValue(
        expectedResponse,
      );

      const result = await resolver.generateCommissionInvoice(
        'test-session-id',
        mockContext,
      );

      expect(result).toEqual(expectedResponse);
      expect(service.generateCommissionInvoice).toHaveBeenCalledTimes(1);
    });

    it('should populate input with client data from context and call the service', async () => {
      const expectedResponse: GenerateCommissionInvoiceResponseDto = {
        message: 'Invoice generated successfully',
        status: 'SUCCESS',
      };

      mockGenerateCommissionInvoiceService.generateCommissionInvoice.mockResolvedValue(
        expectedResponse,
      );

      await resolver.generateCommissionInvoice('test-session-id', mockContext);

      const serviceCallArg =
        mockGenerateCommissionInvoiceService.generateCommissionInvoice.mock
          .calls[0][0];

      expect(serviceCallArg.identification).toBe(
        mockCustomerInfo.identification,
      );
      expect(serviceCallArg.merchantId).toBe(mockCustomerInfo.identification);
      expect(serviceCallArg.comercialName).toBe(mockCustomerInfo.comercialName);
      expect(serviceCallArg.sessionId).toBe('test-session-id');
    });

    it('should generate a sessionId if it is not provided', async () => {
      const expectedResponse: GenerateCommissionInvoiceResponseDto = {
        message: 'Invoice generated successfully',
        status: 'SUCCESS',
      };
      mockGenerateCommissionInvoiceService.generateCommissionInvoice.mockResolvedValue(
        expectedResponse,
      );

      await resolver.generateCommissionInvoice(null, mockContext);

      const serviceCallArg =
        mockGenerateCommissionInvoiceService.generateCommissionInvoice.mock
          .calls[0][0];

      expect(serviceCallArg.sessionId).toBeDefined();
      expect(typeof serviceCallArg.sessionId).toBe('string');
      expect(serviceCallArg.sessionId).not.toBeNull();
    });

    it('should throw an error if the service fails', async () => {
      const errorMessage = 'Service error';
      mockGenerateCommissionInvoiceService.generateCommissionInvoice.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        resolver.generateCommissionInvoice('test-session-id', mockContext),
      ).rejects.toThrow(errorMessage);
    });

    it('should throw an error if customer info is missing in context', async () => {
      const emptyContext = {
        req: {
          headers: {},
        },
      };

      await expect(
        resolver.generateCommissionInvoice('test-session-id', emptyContext),
      ).rejects.toThrow(
        'Customer info is required, customer info is missing in query-get-commission-payout-preview',
      );
    });
  });
});
