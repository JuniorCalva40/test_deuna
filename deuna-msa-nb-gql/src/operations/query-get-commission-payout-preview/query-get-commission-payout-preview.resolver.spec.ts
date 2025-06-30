import { Test, TestingModule } from '@nestjs/testing';
import { GetCommissionPayoutPreviewResolver } from './query-get-commission-payout-preview.resolver';
import { GetCommissionPayoutPreviewService } from './service/query-get-commission-payout-preview.service';
import { GetCommissionPayoutPreviewInput } from './dto/get-commission-payout-preview.input.dto';
import { GetCommissionPayoutPreviewResponseDto } from './dto/get-commission-payout-preview.response.dto';
import { ClientInfo } from '../../core/schema/merchat-client.schema';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { CanActivate } from '@nestjs/common';

describe('GetCommissionPayoutPreviewResolver', () => {
  let resolver: GetCommissionPayoutPreviewResolver;
  let service: GetCommissionPayoutPreviewService;

  const mockCommissionPayoutPreviewService = {
    getCommissionPayoutPreview: jest.fn(),
  };

  const mockClientInfo: ClientInfo = {
    id: 'mock-client-id',
    identification: '1234567890',
    identificationType: 'RUC',
    businessName: 'Test Business',
    comercialName: 'Test Business',
    status: 'ACTIVE',
    coordinator: 'mock-coordinator-id',
  };

  const mockSessionId = 'test-session-id';

  const mockValidationGuard: CanActivate = { canActivate: jest.fn(() => true) };
  const mockGetClientGuard: CanActivate = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCommissionPayoutPreviewResolver,
        {
          provide: GetCommissionPayoutPreviewService,
          useValue: mockCommissionPayoutPreviewService,
        },
      ],
    })
      .overrideGuard(ValidationAuthGuard)
      .useValue(mockValidationGuard)
      .overrideGuard(GetClientGuard)
      .useValue(mockGetClientGuard)
      .compile();

    resolver = module.get<GetCommissionPayoutPreviewResolver>(
      GetCommissionPayoutPreviewResolver,
    );
    service = module.get<GetCommissionPayoutPreviewService>(
      GetCommissionPayoutPreviewService,
    );
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('prepareCommissionPayout', () => {
    it('should call the service with correct parameters and return the result', async () => {
      const input: GetCommissionPayoutPreviewInput = {
        sessionId: mockSessionId,
        requestId: expect.any(String),
        trackingId: expect.any(String),
        merchantId: mockClientInfo.identification,
        identification: mockClientInfo.identification,
      };

      const mockResponse: GetCommissionPayoutPreviewResponseDto = {
        prepareCommissionPayout: {
          subtotalAmount: 100,
          taxDetails: { rate: 0.15, amount: 15 },
          netPayoutAmount: 85,
          payoutReason: 'Pago de comisión 2024-07',
          currency: 'USD',
          destinationAccount: {
            name: 'Test Business',
            ruc: '1234567890',
          },
        },
        status: 'SUCCESS',
      };

      mockCommissionPayoutPreviewService.getCommissionPayoutPreview.mockResolvedValue(
        mockResponse,
      );

      const context = {
        req: {
          headers: {
            'client-info': mockClientInfo,
          },
        },
      };

      const result = await resolver.prepareCommissionPayout(
        mockSessionId,
        context,
      );

      expect(result).toEqual(mockResponse);
      expect(service.getCommissionPayoutPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          ...input,
          merchantId: mockClientInfo.identification,
          identification: mockClientInfo.identification,
          sessionId: mockSessionId,
        }),
      );
    });

    it('should throw an error if client-info is missing', async () => {
      const context = {
        req: {
          headers: {}, // No client-info
        },
      };

      await expect(
        resolver.prepareCommissionPayout(mockSessionId, context),
      ).rejects.toThrow(
        'Customer info is required, customer info is missing in query-get-commission-payout-preview',
      );
    });
  });
});
