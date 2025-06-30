import { Test, TestingModule } from '@nestjs/testing';
import { QueryOnboardingStatusResolver } from './query-onboarding-status.resolver';
import { QueryOnboardingStatusService } from './services/query-onboarding-status.service';
import { QueryOnboardingStatusDto } from './dto/query-onboarding-status.dto';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';

describe('QueryOnboardingStatusResolver', () => {
  let resolver: QueryOnboardingStatusResolver;
  let queryOnboardingStatusService: jest.Mocked<QueryOnboardingStatusService>;

  beforeEach(async () => {
    const mockQueryOnboardingStatusService = {
      getOnboardingStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule], // Incluye HttpModule en imports
      providers: [
        ValidationAuthGuard, // Incluye ValidationAuthGuard en providers
        QueryOnboardingStatusResolver,
        {
          provide: QueryOnboardingStatusService,
          useValue: mockQueryOnboardingStatusService,
        },
        Reflector, // Incluye Reflector en providers
      ],
    }).compile();

    resolver = module.get<QueryOnboardingStatusResolver>(
      QueryOnboardingStatusResolver,
    );
    queryOnboardingStatusService = module.get(
      QueryOnboardingStatusService,
    ) as jest.Mocked<QueryOnboardingStatusService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('queryOnboardingStatus', () => {
    it('should call queryOnboardingStatusService.getOnboardingStatus and return the result', async () => {
      const mockSessionId = '892e7c38-66dd-421c-85a9-bc72b9470ca3';

      const expectedResponse: QueryOnboardingStatusDto = {
        data: [
          'start-onb-cnb',
          'confirm-data',
          'accept-billing',
          'accept-contract',
        ],
        status: 'SUCCESS',
        errors: null,
        requiredSteps: ['sign-contract'],
      };

      queryOnboardingStatusService.getOnboardingStatus.mockResolvedValue(
        expectedResponse,
      );

      const result = await resolver.queryOnboardingStatus(mockSessionId);

      expect(
        queryOnboardingStatusService.getOnboardingStatus,
      ).toHaveBeenCalledWith(mockSessionId);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from queryOnboardingStatusService.getOnboardingStatus', async () => {
      const mockSessionId = 'test-session-id';

      const expectedError = new Error('Test error');

      queryOnboardingStatusService.getOnboardingStatus.mockRejectedValue(
        expectedError,
      );

      await expect(
        resolver.queryOnboardingStatus(mockSessionId),
      ).rejects.toThrow(expectedError);
    });
  });
});
