import { Test, TestingModule } from '@nestjs/testing';
import { AcceptBillingResolver } from './accept-billing.resolver';
import { AcceptBillingService } from './services/accept-billing.service';
import { AcceptBillingResponse } from './dto/accept-billing-response.dto';
import { AcceptBillingInput } from './dto/accept-billing-input.dto';

describe('AcceptBillingResolver', () => {
  let resolver: AcceptBillingResolver;
  let acceptBillingService: jest.Mocked<AcceptBillingService>;

  beforeEach(async () => {
    const mockAcceptBillingService = {
      startAcceptBilling: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptBillingResolver,
        { provide: AcceptBillingService, useValue: mockAcceptBillingService },
      ],
    }).compile();

    resolver = module.get<AcceptBillingResolver>(AcceptBillingResolver);
    acceptBillingService = module.get(
      AcceptBillingService,
    ) as jest.Mocked<AcceptBillingService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('acceptBilling', () => {
    it('should call acceptBillingService.startAcceptBilling and return the result', async () => {
      const mockInput: AcceptBillingInput = {
        sessionId: 'test-session-id',
      };

      const expectedResponse: AcceptBillingResponse = {
        sessionId: 'test-session-id',
        status: 'SUCCESS',
      };

      acceptBillingService.startAcceptBilling.mockResolvedValue(
        expectedResponse,
      );

      const result = await resolver.acceptBilling(mockInput);

      expect(acceptBillingService.startAcceptBilling).toHaveBeenCalledWith(
        mockInput,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from acceptBillingService.startAcceptBilling', async () => {
      const mockInput: AcceptBillingInput = {
        sessionId: 'test-session-id',
      };

      const expectedError = new Error('Test error');

      acceptBillingService.startAcceptBilling.mockRejectedValue(expectedError);

      await expect(resolver.acceptBilling(mockInput)).rejects.toThrow(
        expectedError,
      );
    });
  });
});
