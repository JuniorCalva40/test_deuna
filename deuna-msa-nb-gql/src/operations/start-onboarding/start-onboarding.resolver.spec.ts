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
import { GetUserPersonGuard } from '../../core/guards/get-user.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';

describe('StartOnboardingResolver', () => {
  let resolver: StartOnboardingResolver;
  let startOnboardingService: jest.Mocked<StartOnboardingService>;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@test.com',
    status: 'ACTIVE',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '123456789',
  };

  const mockClientInfo = {
    id: 'client-123',
    status: 'ACTIVE',
    identification: '1234567890',
    identificationType: 'RUC',
    businessName: 'Test Business',
    comercialName: 'Test Commercial',
    coordinator: 'coordinator-123',
  };

  const mockAuthToken = {
    data: {
      ip: '127.0.0.1',
      username: 'testuser',
      personInfo: {
        identification: '1234567890',
      },
    },
    sessionId: 'session-123',
    deviceId: 'device-123',
    signature: 'signature-123',
    tokenType: 'Bearer',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule], // Incluye HttpModule en imports
      providers: [
        StartOnboardingResolver,
        {
          provide: StartOnboardingService,
          useValue: {
            startOnboarding: jest.fn(),
          },
        },
        Reflector, // Incluye Reflector en providers
      ],
    })
      .overrideGuard(ValidationAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetUserPersonGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GetClientGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<StartOnboardingResolver>(StartOnboardingResolver);
    startOnboardingService = module.get(StartOnboardingService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('startOnboarding', () => {
    it('should call startOnboardingService and return the result', async () => {
      const mockSessionId = 'test-session-id';
      const mockResponse: StartOnboardingResponse = {
        onboardingSessionId: mockSessionId,
        establishments: [],
        status: 'SUCCESS',
      };
      startOnboardingService.startOnboarding.mockResolvedValue(mockResponse);

      const mockContext = createMockContext({
        req: {
          headers: {
            'user-person': mockUser,
            'client-info': mockClientInfo,
            'auth-token': mockAuthToken,
          },
        },
      });

      const result = await resolver.startOnboarding(mockSessionId, mockContext);

      expect(result).toEqual(mockResponse);
      expect(startOnboardingService.startOnboarding).toHaveBeenCalledWith({
        username: mockUser.username,
        identification: mockClientInfo.identification,
        email: mockUser.email,
        sessionId: mockSessionId,
        trackingId: expect.any(String),
        requestId: expect.any(String),
        id: mockClientInfo.id,
        businessName: mockClientInfo.businessName,
        applicantName: mockUser.firstName,
        applicantLastName: mockUser.lastName,
        phoneNumber: mockUser.phoneNumber,
      });
    });

    it('should generate a new sessionId if none is provided', async () => {
      const mockResponse: StartOnboardingResponse = {
        onboardingSessionId: 'new-session-id',
        establishments: [],
        status: 'SUCCESS',
      };
      startOnboardingService.startOnboarding.mockResolvedValue(mockResponse);

      const mockContext = createMockContext({
        req: {
          headers: {
            'user-person': mockUser,
            'client-info': mockClientInfo,
            'auth-token': mockAuthToken,
          },
        },
      });

      await resolver.startOnboarding(null, mockContext);

      expect(startOnboardingService.startOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expect.any(String),
        }),
      );
    });

    it('should throw an error if the service fails', async () => {
      const mockSessionId = 'test-session-id';
      const error = new Error('Service Error');
      startOnboardingService.startOnboarding.mockRejectedValue(error);

      const mockContext = createMockContext({
        req: {
          headers: {
            'user-person': mockUser,
            'client-info': mockClientInfo,
            'auth-token': mockAuthToken,
          },
        },
      });

      await expect(
        resolver.startOnboarding(mockSessionId, mockContext),
      ).rejects.toThrow(error);
    });
  });
});
