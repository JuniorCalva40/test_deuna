import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingClientAdapter } from './onboarding-client.adapter';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('OnboardingClientAdapter', () => {
  let adapter: OnboardingClientAdapter;
  let httpServiceMock: jest.Mocked<HttpService>;
  let configServiceMock: jest.Mocked<ConfigService>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    httpServiceMock = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    configServiceMock = {
      get: jest.fn().mockReturnValue('http://mock-url.com'),
    } as unknown as jest.Mocked<ConfigService>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingClientAdapter,
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    adapter = module.get<OnboardingClientAdapter>(OnboardingClientAdapter);
    (adapter as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize apiUrl from config', () => {
      // Arrange
      const mockUrl = 'http://onboarding-api.example.com';
      configServiceMock.get.mockReturnValue(mockUrl);

      // Act
      const newAdapter = new OnboardingClientAdapter(
        httpServiceMock,
        configServiceMock,
      );

      // Assert
      expect(configServiceMock.get).toHaveBeenCalledWith(
        'MSA_CO_ONBOARDING_STATUS_URL',
      );
      expect((newAdapter as any).apiUrl).toBe(mockUrl);
    });

    it('should throw error when MSA_CO_ONBOARDING_STATUS_URL is not defined', () => {
      // Arrange
      configServiceMock.get.mockReturnValue(null);

      // Act & Assert
      expect(() => {
        new OnboardingClientAdapter(httpServiceMock, configServiceMock);
      }).toThrow('MSA_CO_ONBOARDING_STATUS_URL is not defined');
    });
  });

  describe('getOnboardingState', () => {
    it('should get onboarding state successfully', async () => {
      // Arrange
      const sessionId = 'session123';
      const mockResponse = {
        status: 'SUCCESS',
        sessionId: sessionId,
        securitySeed: 'seed123',
        identityId: 'id123',
        onbType: 'type',
        data: { testData: 'value' },
        successSteps: ['step1'],
        failureSteps: [],
        requiredSteps: ['step1', 'step2'],
        optionalSteps: ['step3'],
      };

      // Mock usando of() para crear un observable válido con una respuesta axios
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpServiceMock.get.mockReturnValue(of(axiosResponse));

      // Act
      const result = await adapter.getOnboardingState(sessionId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(httpServiceMock.get).toHaveBeenCalledWith(
        `http://mock-url.com/status/session/${sessionId}`,
      );
    });

    it('should handle error when getOnboardingState fails', async () => {
      // Arrange
      const sessionId = 'session123';
      const errorMsg = 'HTTP error';

      // Usar throwError para simular un error en el observable
      httpServiceMock.get.mockReturnValue(
        throwError(() => new Error(errorMsg)),
      );

      // Act & Assert
      await expect(adapter.getOnboardingState(sessionId)).rejects.toThrow(
        `Onboarding service error: ${errorMsg}`,
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  describe('updateOnboardingState', () => {
    it('should update onboarding state successfully', async () => {
      // Arrange
      const sessionId = 'session123';
      const stepName = 'test-step';
      const updateData = {
        status: 'SUCCESS',
        data: {
          onboardingSessionId: sessionId,
          statusResultValidation: 'finalized_ok',
          comment: 'test comment',
        },
      };

      const mockResponse = {
        status: 'SUCCESS',
        step: stepName,
        successSteps: ['test-step'],
        requiredSteps: ['test-step'],
        optionalSteps: [],
        failureSteps: [],
        identityId: 'id123',
        data: { updated: true },
      };

      // Mock usando of() para crear un observable válido
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpServiceMock.patch.mockReturnValue(of(axiosResponse));

      // Act
      const result = await adapter.updateOnboardingState(updateData, stepName);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(httpServiceMock.patch).toHaveBeenCalledWith(
        `http://mock-url.com/status/${sessionId}/${stepName}`,
        updateData,
      );
    });

    it('should handle error when updateOnboardingState fails', async () => {
      // Arrange
      const sessionId = 'session123';
      const stepName = 'test-step';
      const updateData = {
        status: 'SUCCESS',
        data: {
          onboardingSessionId: sessionId,
          statusResultValidation: 'finalized_ok',
        },
      };
      const errorMsg = 'HTTP error';

      // Usar throwError para simular un error en el observable
      httpServiceMock.patch.mockReturnValue(
        throwError(() => new Error(errorMsg)),
      );

      // Act & Assert
      await expect(
        adapter.updateOnboardingState(updateData, stepName),
      ).rejects.toThrow(`Onboarding service error: ${errorMsg}`);
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });
});
