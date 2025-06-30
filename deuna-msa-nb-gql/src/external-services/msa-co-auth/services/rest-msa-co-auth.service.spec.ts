import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RestMsaCoAuthService } from './rest-msa-co-auth.service';
import { GenerateOtpInputDto } from '../dto/msa-co-auth-input.dto';
import { AxiosResponse, AxiosError } from 'axios';
import { errorCodes as msaCoAuthErrorCodes } from '../constants/constants';
import { ErrorCodes } from '@deuna/tl-common-nd';

describe('RestMsaCoAuthService', () => {
  let service: RestMsaCoAuthService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaCoAuthService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                MSA_CO_AUTH_URL: 'http://api.example.com',
                'httpClient.retry': '2',
                'httpClient.timeout': '50000',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaCoAuthService>(RestMsaCoAuthService);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should handle http error', (done) => {
      const mockInput: GenerateOtpInputDto = {
        businessDeviceId: 'test-device-id',
        requestId: 'test-request-id',
        email: 'test@example.com',
        deviceName: 'Test Device',
        commerceName: 'Test Commerce',
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service.generateOtp(mockInput).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            'Failed to post generateOtp state in RestMsaCoAuthService: HTTP Error',
          );
          done();
        },
      });
    });

    it('should log error response details', (done) => {
      const mockInput: GenerateOtpInputDto = {
        businessDeviceId: 'test-device-id',
        requestId: 'test-request-id',
        email: 'test@example.com',
        deviceName: 'Test Device',
        commerceName: 'Test Commerce',
      };

      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        },
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(throwError(() => errorResponse));

      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      service.generateOtp(mockInput).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            'Failed to post generateOtp state in RestMsaCoAuthService: undefined',
          );
          expect(loggerErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('generateOtp failed'),
          );
          expect(loggerErrorSpy).toHaveBeenCalledWith('Response status: 400');
          expect(loggerErrorSpy).toHaveBeenCalledWith(
            'Response data: {"message":"Bad Request"}',
          );
          loggerErrorSpy.mockRestore();
          done();
        },
      });
    });

    it('should use EMAIL_NOTIFICATION as default notification channel', (done) => {
      const mockInput: GenerateOtpInputDto = {
        businessDeviceId: 'test-device-id',
        requestId: 'test-request-id',
        email: 'test@example.com',
        deviceName: 'Test Device',
        commerceName: 'Test Commerce',
      };

      const expectedData = {
        ...mockInput,
        phoneNumber: '',
        notificationChannel: ['EMAIL_NOTIFICATION'],
      };

      const mockResponse = { status: 'SUCCESS' };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };

      httpService.post.mockReturnValue(of(axiosResponse));

      service.generateOtp(mockInput).subscribe({
        next: () => {
          expect(httpService.post).toHaveBeenCalledWith(
            'http://api.example.com/microcommerce-otp/contract/generate',
            expectedData,
            expect.any(Object),
          );
          done();
        },
        error: done,
      });
    });

    it('should handle a generic error without a response object', (done) => {
      const genericError = new Error('Network Error');
      httpService.post.mockReturnValue(throwError(() => genericError));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      service.generateOtp({} as any).subscribe({
        error: (err) => {
          expect(err.message).toContain('Network Error');
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining(
              'generateOtp failed in RestMsaCoAuthService: Network Error',
            ),
          );
          expect(loggerSpy).not.toHaveBeenCalledWith(
            expect.stringContaining('Response status'),
          );
          done();
        },
      });
    });
  });
});

describe('RestMsaCoAuthService', () => {
  let service: RestMsaCoAuthService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaCoAuthService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            put: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config = {
                MSA_CO_AUTH_URL: 'http://api.example.com',
                'httpClient.retry': '2',
                'httpClient.timeout': '50000',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaCoAuthService>(RestMsaCoAuthService);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateOtp', () => {
    it('should validate OTP successfully', (done) => {
      const mockResponse = { status: 'SUCCESS' };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: undefined,
        },
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.put.mockReturnValue(of(axiosResponse));

      service.validateOtp('testDevice', 'testRequest', '123456').subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(httpService.put).toHaveBeenCalledWith(
            'http://api.example.com/microcommerce-otp/contract/validate',
            {
              businessDeviceId: 'testDevice',
              requestId: 'testRequest',
              otp: '123456',
            },
          );
          done();
        },
        error: done,
      });
    });

    it('should handle error with remaining attempts', (done) => {
      const errorCode = ErrorCodes.MIC_ONB_STATUS_OTP_VERIFY_TWO_REMAINING_ATTEMPT;
      const errorResponse = new AxiosError(
        'Request failed with status code 400',
        '400',
        undefined,
        {},
        {
          data: {
            errors: [{ code: errorCode }],
          },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: { headers: undefined },
        },
      );

      httpService.put.mockReturnValue(throwError(() => errorResponse));

      service.validateOtp('testDevice', 'testRequest', '123456').subscribe({
        error: (error) => {
          expect(error.remainingVerifyAttempts).toBe(
            msaCoAuthErrorCodes[errorCode],
          );
          expect(error.message).toContain(
            'Failed to post validateOtp state in RestMsaCoAuthService',
          );
          done();
        },
      });
    });
  });
});

describe('RestMsaCoAuthService EnvVars Nor Set', () => {
  let service: RestMsaCoAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaCoAuthService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            put: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaCoAuthService>(RestMsaCoAuthService);
  });

  it('should throw an error during generateOtp if apiUrl is not configured', (done) => {
    service.generateOtp({} as any).subscribe({
      error: (error) => {
        expect(error.message).toBe(
          'MSA_CO_AUTH_URL is not defined in the configuration',
        );
        done();
      },
    });
  });

  it('should throw an error during validateOtp if apiUrl is not configured', (done) => {
    service.validateOtp('a', 'b', 'c').subscribe({
      error: (error) => {
        expect(error.message).toBe(
          'MSA_CO_AUTH_URL is not defined in the configuration',
        );
        done();
      },
    });
  });
});
