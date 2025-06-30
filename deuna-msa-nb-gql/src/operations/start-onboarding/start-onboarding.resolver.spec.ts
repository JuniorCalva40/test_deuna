import { Test, TestingModule } from '@nestjs/testing';
import { StartOnboardingResolver } from './start-onboarding.resolver';
import { StartOnboardingService } from './service/start-onboarding.service';
import { StartOnboardingResponse } from './dto/start-onboarding-response.dto';
import { EstablishmentOutputDto } from '../../utils/establishment.dto';
import { ConfigModule } from '@nestjs/config';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { Reflector } from '@nestjs/core';
import { createMockContext } from '../../core/test-utils/gql-context-mock';

describe('StartOnboardingResolver', () => {
  let resolver: StartOnboardingResolver;
  let startOnboardingService: jest.Mocked<StartOnboardingService>;

  beforeEach(async () => {
    const mockStartOnboardingService = {
      startOnboarding: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule], // Incluye HttpModule en imports
      providers: [
        StartOnboardingResolver,
        ValidationAuthGuard, // Incluye ValidationAuthGuard en providers
        {
          provide: StartOnboardingService,
          useValue: mockStartOnboardingService,
        },
        Reflector, // Incluye Reflector en providers
      ],
    }).compile();

    resolver = module.get<StartOnboardingResolver>(StartOnboardingResolver);
    startOnboardingService = module.get(
      StartOnboardingService,
    ) as jest.Mocked<StartOnboardingService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('startOnboarding', () => {
    it('should call startOnboardingService.startOnboarding and return the result', async () => {
      const mockEstablishment: EstablishmentOutputDto = {
        fullAddress: 'Test Address 123',
        numberEstablishment: '001',
      };

      const expectedResponse: StartOnboardingResponse = {
        sessionId: 'test-session-id',
        establishments: [mockEstablishment],
        status: 'SUCCESS',
      };

      startOnboardingService.startOnboarding.mockResolvedValue(
        expectedResponse,
      );

      const userName = 'testUser';

      const mockContext = createMockContext({
        req: {
          headers: {
            'auth-token': {
              data: {
                username: userName,
                personInfo: {
                  identification: '',
                },
              },
              sessionId: '',
              deviceId: '',
              signature: '',
              tokenType: '',
              role: '',
            },
            'user-person': {
              id: '123',
              email: 'test@test.com',
              status: 'ACTIVE',
            },
          },
        },
      });

      const result = await resolver.startOnboarding(mockContext);

      expect(startOnboardingService.startOnboarding).toHaveBeenCalledWith(
        'testUser',
        'test@test.com',
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors from startOnboardingService.startOnboarding', async () => {
      const expectedError = new Error('Test error');

      const userName = 'testUser';

      const mockContext = createMockContext({
        req: {
          headers: {
            'auth-token': {
              data: {
                username: userName,
                personInfo: {
                  identification: '',
                },
              },
              sessionId: '',
              deviceId: '',
              signature: '',
              tokenType: '',
              role: '',
            },
            'user-person': {
              id: '123',
              email: 'test@test.com',
              status: 'ACTIVE',
            },
          },
        },
      });

      startOnboardingService.startOnboarding.mockRejectedValue(expectedError);

      await expect(resolver.startOnboarding(mockContext)).rejects.toThrow(
        expectedError,
      );
    });
  });
});
