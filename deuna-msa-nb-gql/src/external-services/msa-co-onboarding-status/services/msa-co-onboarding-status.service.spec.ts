import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, of, throwError } from 'rxjs';
import { first } from 'rxjs/operators';
import { AxiosResponse } from 'axios';
import { RestMsaCoOnboardingStatusService } from './rest-msa-co-onboarding-status.service';
import {
  DataUpdateOnboardingAcceptBillingInputDto,
  InitOnboardingInputDto,
  StartOnboardingInputDto,
  UpdateDataOnboardingInputDto,
} from '../dto/msa-co-onboarding-status-input.dto';
import {
  ConfirmDataResponseDto,
  SetStepValidateOtpResponseDto,
} from '../dto/msa-co-onboarding-status-response.dto';

describe('RestMsaCoOnboardingStatusService', () => {
  let service: RestMsaCoOnboardingStatusService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaCoOnboardingStatusService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            patch: jest.fn(),
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaCoOnboardingStatusService>(
      RestMsaCoOnboardingStatusService,
    );
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    configService.get.mockReturnValue('http://localhost:8080');
  });

  describe('constructor', () => {
    it('should set default values if config is not provided', () => {
      configService.get.mockReturnValue(undefined);
      const newService = new RestMsaCoOnboardingStatusService(
        httpService,
        configService,
      );
      expect(newService['apiUrl']).toBe('http://localhost:8080');
      expect(newService['retry']).toBe(2);
      expect(newService['timeout']).toBe(50000);
    });
  });

  describe('initOnboarding', () => {
    it('should successfully initiate onboarding', (done) => {
      const mockInput: InitOnboardingInputDto = {
        identityId: 'test-id',
        onbType: 'test-type',
        securitySeed: 'test-seed',
        publicKey: 'test-key',
      };
      const mockResponse = { sessionId: 'test-session' };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.post.mockReturnValue(of(axiosResponse));

      service
        .initOnboarding(mockInput)
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockResponse);
            expect(httpService.post).toHaveBeenCalledWith(
              'http://localhost:8080/status',
              mockInput,
            );
            done();
          },
          error: done,
        });
    });

    it('should handle error in initOnboarding', (done) => {
      const mockInput: InitOnboardingInputDto = {
        identityId: 'test-id',
        onbType: 'test-type',
        securitySeed: 'test-seed',
        publicKey: 'test-key',
      };

      httpService.post.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service
        .initOnboarding(mockInput)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to initiate onboarding in RestMsaCoOnboardingStatusService: HTTP Error',
            );
            done();
          },
        });
    });
  });

  describe('startOnboarding', () => {
    it('should successfully start onboarding', (done) => {
      const mockInput: StartOnboardingInputDto = {
        sessionId: 'test-session',
        status: 'SUCCESS',
        data: {
          cnbClientId: 'test-client',
          companyName: 'Test Company',
          ruc: 123456,
          email: 'test@test.com',
          establishment: [],
          fullName: 'Test User',
          phoneNumber: '3003216548',
        },
      };
      const mockResponse = { status: 'SUCCESS' };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      service
        .startOnboarding(mockInput)
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockResponse);
            expect(httpService.patch).toHaveBeenCalledWith(
              'http://localhost:8080/status/test-session/start-onb-cnb',
              mockInput,
            );
            done();
          },
          error: done,
        });
    });

    it('should handle error in startOnboarding', (done) => {
      const mockInput: StartOnboardingInputDto = {
        sessionId: 'test-session',
        status: 'SUCCESS',
        data: {
          cnbClientId: 'test-client',
          companyName: 'Test Company',
          ruc: 123456,
          email: 'test@test.com',
          establishment: [],
          fullName: 'Test User',
          phoneNumber: '30032154876',
        },
      };

      httpService.patch.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service
        .startOnboarding(mockInput)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to start onboarding in RestMsaCoOnboardingStatusService: HTTP Error',
            );
            done();
          },
        });
    });
  });

  describe('getClientDataFromStartOnboardingState', () => {
    it('should successfully get client data', (done) => {
      const mockSessionId = 'test-session';
      const mockResponse = {
        data: {
          'start-onb-cnb': {
            data: {
              cnbClientId: 'test-client',
              email: 'test@test.com',
              companyName: 'Test Company',
              ruc: '123456',
              businessAddress: 'Test Address',
              legalRepresentative: 'Test User',
              establishment: {},
            },
          },
        },
        identityId: 'test-identity',
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get.mockReturnValue(of(axiosResponse));

      service
        .getClientDataFromStartOnboardingState(mockSessionId)
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual({
              cnbClientId: 'test-client',
              email: 'test@test.com',
              companyName: 'Test Company',
              ruc: '123456',
              businessAddress: 'Test Address',
              legalRepresentative: 'Test User',
              establishment: {},
              identityId: 'test-identity',
            });
            expect(httpService.get).toHaveBeenCalledWith(
              'http://localhost:8080/status/session/test-session',
            );
            done();
          },
          error: done,
        });
    });

    it('should handle error in getClientDataFromStartOnboardingState', (done) => {
      const mockSessionId = 'test-session';

      httpService.get.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service
        .getClientDataFromStartOnboardingState(mockSessionId)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to get client data from start onboarding state in RestMsaCoOnboardingStatusService: HTTP Error',
            );
            done();
          },
        });
    });
  });

  describe('updateOnboardingState', () => {
    it('should successfully update onboarding state', (done) => {
      const mockInput: UpdateDataOnboardingInputDto = {
        sessionId: 'test-session',
        status: 'SUCCESS',
        data: {
          acceptBilling: true,
        } as DataUpdateOnboardingAcceptBillingInputDto,
      };
      const mockResponse = { status: 'SUCCESS' };
      const axiosResponse: AxiosResponse<{ status: string }> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      service
        .updateOnboardingState(mockInput, 'test-step')
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockResponse);
            expect(httpService.patch).toHaveBeenCalledWith(
              'http://localhost:8080/status/test-session/test-step',
              mockInput,
            );
            done();
          },
          error: done,
        });
    });

    it('should handle error in updateOnboardingState', (done) => {
      const mockInput: UpdateDataOnboardingInputDto = {
        sessionId: 'test-session',
        status: 'SUCCESS',
        data: {},
      };

      httpService.patch.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service
        .updateOnboardingState(mockInput, 'test-step')
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to update onboarding state in RestMsaCoOnboardingStatusService: HTTP Error',
            );
            done();
          },
        });
    });
  });

  describe('getOnboardingState', () => {
    it('should successfully get onboarding state', (done) => {
      const mockSessionId = 'test-session';
      const mockResponse = { status: 'SUCCESS', data: {} };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get.mockReturnValue(of(axiosResponse));

      service
        .getOnboardingState(mockSessionId)
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockResponse);
            expect(httpService.get).toHaveBeenCalledWith(
              'http://localhost:8080/status/session/test-session',
              { headers: { 'Content-Type': 'application/json' } },
            );
            done();
          },
          error: done,
        });
    });

    it('should handle error in getOnboardingState', (done) => {
      const mockSessionId = 'test-session';

      httpService.get.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service
        .getOnboardingState(mockSessionId)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to get onboarding state in RestMsaCoOnboardingStatusService: HTTP Error',
            );
            done();
          },
        });
    });
  });

  describe('error handling', () => {
    it('should log detailed error information', (done) => {
      const mockInput: InitOnboardingInputDto = {
        identityId: 'test-id',
        onbType: 'test-type',
        securitySeed: 'test-seed',
        publicKey: 'test-key',
      };

      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        },
      };

      httpService.post.mockReturnValue(throwError(() => errorResponse));

      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      service
        .initOnboarding(mockInput)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to initiate onboarding in RestMsaCoOnboardingStatusService: Bad Request',
            );
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              expect.stringContaining('initiate onboarding failed'),
            );
            expect(loggerErrorSpy).toHaveBeenCalledWith('Response status: 400');
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              'Response data: {"message":"Bad Request"}',
            );
            done();
          },
        });
    });
  });

  describe('setStepAcceptContract', () => {
    const mockBodyUpdateOnboardingState = {
      requestId: 'mock-request-id',
      email: 'test@test.com',
      deviceName: 'Mock Device',
      commerceName: 'Mock Commerce',
      notificationChannel: ['SMS', 'EMAIL'],
      sessionId: 'mock-session-id',
      businessDeviceId: 'mock-business-device-id',
      status: 'SUCCESS',
    };

    it('should successfully set step accept contract', async () => {
      const mockResponse: ConfirmDataResponseDto = {
        successSteps: ['accept-contract'],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'SUCCESS',
        onbType: 'test-type',
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      const result = await firstValueFrom(
        service.setStepAcceptContract(mockBodyUpdateOnboardingState),
      );

      expect(result).toEqual(mockResponse);
      expect(httpService.patch).toHaveBeenCalledWith(
        'http://localhost:8080/status/mock-session-id/accept-contract',
        { ...mockBodyUpdateOnboardingState, status: 'SUCCESS' },
      );
    });

    it('should handle error in setStepAcceptContract', (done) => {
      httpService.patch.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service
        .setStepAcceptContract(mockBodyUpdateOnboardingState)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to set step accept contract in RestMsaCoOnboardingStatusService: HTTP Error',
            );
            done();
          },
        });
    });

    it('should log detailed error information in setStepAcceptContract', (done) => {
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        },
      };

      httpService.patch.mockReturnValue(throwError(() => errorResponse));

      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      service
        .setStepAcceptContract(mockBodyUpdateOnboardingState)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to set step accept contract in RestMsaCoOnboardingStatusService: Bad Request',
            );
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              expect.stringContaining('set step accept contract failed'),
            );
            expect(loggerErrorSpy).toHaveBeenCalledWith('Response status: 400');
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              'Response data: {"message":"Bad Request"}',
            );
            done();
          },
        });
    });
  });

  describe('setStepValidateOtp', () => {
    it('debería validar el OTP con éxito', (done) => {
      const mockSessionId = 'mock-session-id';
      const mockOtp = '123456';
      const mockResponse: SetStepValidateOtpResponseDto = {
        successSteps: ['validate-otp'],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'SUCCESS',
        onbType: 'test-type',
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      service
        .setStepValidateOtp(mockSessionId, mockOtp)
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockResponse);
            expect(httpService.patch).toHaveBeenCalledWith(
              'http://localhost:8080/status/mock-session-id/validate-otp',
              { status: 'SUCCESS', data: { otp: mockOtp } },
            );
            done();
          },
          error: done,
        });
    });

    it('should handle error in setStepValidateOtp', (done) => {
      const mockSessionId = 'mock-session-id';
      const mockOtp = '123456';

      httpService.patch.mockReturnValue(
        throwError(() => new Error('Error HTTP')),
      );

      service
        .setStepValidateOtp(mockSessionId, mockOtp)
        .pipe(first())
        .subscribe({
          next: () => done('No debería tener éxito'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to set step validate otp in RestMsaCoOnboardingStatusService: Error HTTP',
            );
            done();
          },
        });
    });

    it('should log detailed error information in setStepValidateOtp', (done) => {
      const mockSessionId = 'mock-session-id';
      const mockOtp = '123456';
      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        },
      };

      httpService.patch.mockReturnValue(throwError(() => errorResponse));

      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      service
        .setStepValidateOtp(mockSessionId, mockOtp)
        .pipe(first())
        .subscribe({
          next: () => done('No debería tener éxito'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to set step validate otp in RestMsaCoOnboardingStatusService: Bad Request',
            );
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              expect.stringContaining('set step validate otp failed'),
            );
            expect(loggerErrorSpy).toHaveBeenCalledWith('Response status: 400');
            expect(loggerErrorSpy).toHaveBeenCalledWith(
              'Response data: {"message":"Bad Request"}',
            );
            done();
          },
        });
    });
  });

  describe('getOtpDataFromValidateOtpState', () => {
    it('should successfully get OTP data', (done) => {
      const mockSessionId = 'test-session';
      const mockResponse = {
        data: {
          'validate-otp': {
            data: {
              otp: '123456',
            },
          },
        },
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get.mockReturnValue(of(axiosResponse));

      service
        .getOtpDataFromValidateOtpState(mockSessionId)
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual({ otp: '123456' });
            expect(httpService.get).toHaveBeenCalledWith(
              'http://localhost:8080/status/session/test-session',
            );
            done();
          },
          error: done,
        });
    });

    it('should handle error in getOtpDataFromValidateOtpState', (done) => {
      const mockSessionId = 'test-session';

      httpService.get.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service
        .getOtpDataFromValidateOtpState(mockSessionId)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to get client data from otp validation state in RestMsaCoOnboardingStatusService: HTTP Error',
            );
            done();
          },
        });
    });
  });

  describe('completeOnboarding', () => {
    it('should successfully complete onboarding', (done) => {
      const mockSessionId = 'test-session';
      const mockResponse: ConfirmDataResponseDto = {
        successSteps: ['complete'],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'COMPLETED',
        onbType: 'test-type',
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      service
        .completeOnboarding(mockSessionId)
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockResponse);
            expect(httpService.patch).toHaveBeenCalledWith(
              'http://localhost:8080/status/test-session',
              { status: 'COMPLETED' },
            );
            done();
          },
          error: done,
        });
    });

    it('should handle error in completeOnboarding', (done) => {
      const mockSessionId = 'test-session';

      httpService.patch.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service
        .completeOnboarding(mockSessionId)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to set step accept contract in RestMsaCoOnboardingStatusService: HTTP Error',
            );
            done();
          },
        });
    });

    it('should throw an error if API URL is not defined', () => {
      const mockSessionId = 'test-session';
      configService.get.mockReturnValue(undefined);

      expect(() => service.completeOnboarding(mockSessionId)).toThrow(
        `Cannot read properties of undefined (reading 'pipe')`,
      );
    });
  });
});
