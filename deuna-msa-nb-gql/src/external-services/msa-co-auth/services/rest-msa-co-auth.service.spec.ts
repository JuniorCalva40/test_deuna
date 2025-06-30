import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RestMsaCoAuthService } from './rest-msa-co-auth.service';
import { GenerateOtpInputDto } from '../dto/msa-co-auth-input.dto';
import { AxiosResponse } from 'axios';

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
        notificationChannel: ['SMS', 'EMAIL'],
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
        notificationChannel: ['SMS', 'EMAIL'],
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
  });
});

describe('RestMsaCoAuthService EnvVars Nor Set', () => {
  let service: RestMsaCoAuthService;
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
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaCoAuthService>(RestMsaCoAuthService);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should throw error when MSA_CO_AUTH_URL is not defined', () => {
    configService.get.mockReturnValue(undefined);

    expect(() =>
      service.validateOtp('testDevice', 'testRequest', '123456'),
    ).toThrowError(`MSA_CO_AUTH_URL is not defined in the configuration`);
  });

  it('should throw error when MSA_CO_AUTH_URL is not defined', () => {
    configService.get.mockReturnValue(undefined);

    expect(() => service.generateOtp({} as GenerateOtpInputDto)).toThrowError(
      `MSA_CO_AUTH_URL is not defined in the configuration`,
    );
  });
});
