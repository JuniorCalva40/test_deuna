import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { first } from 'rxjs/operators';
import { AxiosResponse } from 'axios';
import { RestMsaNbOrqTransactionService } from './rest-msa-nb-orq-transaction.service';
import { GenerateQrInputDto } from '../dto/generate-qr-input.dto';
import { GenerateQrResponseDto } from '../dto/generate-qr-response.dto';
import { ExecuteDepositInputDto } from '../dto/execute-deposit-input.dto';
import { ExecuteDepositResponseDto } from '../dto/execute-deposit-response.dto';
import { ValidateDepositAccountInputDto } from '../dto/validate-deposit-account-input.dto';
import { ValidateDepositAccountResponseDto } from '../dto/validate-deposit-account-response.dto';
import { InitiateCellPhoneDepositInputDto } from '../dto/initiate-cellphone-deposit-input.dto';
import { InitiateCellPhoneDepositResponseDto } from '../dto/initiate-cellphone-deposit-response.dto';
import { ConfirmDepositInputDto } from '../dto/confirm-deposit-input.dto';
import { ConfirmDepositResponseDto } from '../dto/confirm-deposit-response.dto';
import { AxiosError } from 'axios';
import { Observable } from 'rxjs';

describe('RestMsaNbOrqTransactionService', () => {
  let service: RestMsaNbOrqTransactionService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaNbOrqTransactionService,
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

    service = module.get<RestMsaNbOrqTransactionService>(
      RestMsaNbOrqTransactionService,
    );
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    configService.get.mockReturnValue('http://localhost:8080');
  });

  describe('constructor', () => {
    it('should set default values if config is not provided', () => {
      configService.get.mockReturnValue(undefined);
      const newService = new RestMsaNbOrqTransactionService(
        httpService,
        configService,
      );
      expect(newService['apiUrl']).toBe('http://localhost:8080');
    });
  });
});

describe('RestMsaNbOrqTransactionService.generateQr', () => {
  let service: RestMsaNbOrqTransactionService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaNbOrqTransactionService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
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

    service = module.get<RestMsaNbOrqTransactionService>(
      RestMsaNbOrqTransactionService,
    );
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    configService.get.mockReturnValue('http://localhost:8080');
  });

  it('should successfully generate QR code', (done) => {
    const mockInput: GenerateQrInputDto = {
      identification: 'test-id',
      deviceId: 'test-device',
      amount: 100,
    };

    const mockResponse: GenerateQrResponseDto = {
      status: 'success',
      message: 'QR generated successfully',
      data: {
        qrUrl: 'http://test.url',
        qrBase64: 'base64string',
        transactionId: 'test-transaction',
      },
    };

    const axiosResponse: AxiosResponse = {
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    httpService.post.mockReturnValue(of(axiosResponse));

    service
      .generateQr(mockInput)
      .pipe(first())
      .subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(httpService.post).toHaveBeenCalledWith(
            'http://localhost:8080/qr/generate',
            mockInput,
          );
          done();
        },
        error: done,
      });
  });

  it('should handle error in generateQr', (done) => {
    const mockInput: GenerateQrInputDto = {
      identification: 'test-id',
      deviceId: 'test-device',
      amount: 100,
    };

    httpService.post.mockReturnValue(throwError(() => new Error('HTTP Error')));

    service
      .generateQr(mockInput)
      .pipe(first())
      .subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            'Failed to generate QR code in RestMsaNbOrqTransactionService: HTTP Error',
          );
          done();
        },
      });
  });
});

describe('RestMsaNbOrqTransactionService.executeDeposit', () => {
  let service: RestMsaNbOrqTransactionService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaNbOrqTransactionService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
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

    service = module.get<RestMsaNbOrqTransactionService>(
      RestMsaNbOrqTransactionService,
    );
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    configService.get.mockReturnValue('http://localhost:8080');
  });

  it('should successfully execute deposit', (done) => {
    const mockInput: ExecuteDepositInputDto = {
      transactionId: '123e4567-e89b-12d3-a456-426614174000',
      sessionId: 'session-123456789',
      deviceId: 'device-987654321',
      deviceIp: '192.168.1.100',
      trackingId: 'tracking-123456789',
    };
  
    const mockResponse: ExecuteDepositResponseDto = {
      status: 'success',
      message: 'Deposit successfully processed',
    };
  
    const axiosResponse: AxiosResponse = {
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: {},
      } as any,
    };
  
    httpService.post.mockReturnValue(of(axiosResponse));
  
    service
      .executeDeposit(mockInput)
      .pipe(first())
      .subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(httpService.post).toHaveBeenCalledWith(
            'http://localhost:8080/deposit/execute-deposit',
            mockInput,
            {
              headers: {
                'Content-Type': 'application/json',
                trackingId: 'tracking-123456789',
              },
            },
          );
          done();
        },
        error: done,
      });
  });

  it('should handle error in executeDeposit', (done) => {
    const mockInput: ExecuteDepositInputDto = {
      transactionId: '123e4567-e89b-12d3-a456-426614174000',
      sessionId: 'session-123456789',
      deviceId: 'device-987654321',
      deviceIp: '192.168.1.100',
      trackingId: 'tracking-123456789',
    };

    httpService.post.mockReturnValue(throwError(() => new Error('HTTP Error')));

    service
      .executeDeposit(mockInput)
      .pipe(first())
      .subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            'Failed to execute deposit in RestMsaNbOrqTransactionService: HTTP Error',
          );
          done();
        },
      });
  });

  describe('RestMsaNbOrqTransactionService.initiateCellPhoneDeposit', () => {
    let service: RestMsaNbOrqTransactionService;
    let httpService: jest.Mocked<HttpService>;
    let configService: jest.Mocked<ConfigService>;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          RestMsaNbOrqTransactionService,
          {
            provide: HttpService,
            useValue: {
              post: jest.fn(),
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

      service = module.get<RestMsaNbOrqTransactionService>(
        RestMsaNbOrqTransactionService,
      );
      httpService = module.get(HttpService);
      configService = module.get(ConfigService);

      configService.get.mockReturnValue('http://localhost:8080');
    });

    it('should successfully initiate cellphone deposit', (done) => {
      const mockInput: InitiateCellPhoneDepositInputDto = {
        beneficiaryPhoneNumber: '1234567890',
        ordererIdentification: 'test-id',
        ipAddress: '',
        deviceId: 'test-device',
        sessionId: 'test-session',
        trackingId: 'test-tracking-id',
        amount: 100,
        reason: 'test-reason',
      };

      const mockResponse: InitiateCellPhoneDepositResponseDto = {
        status: 'success',
        message: 'Cellphone deposit initiated successfully',
        trackingId: 'test-tracking-id',
        transactionId: 'test-transaction-id',
        beneficiaryAccountNumber: '1234567890',
        beneficiaryName: 'test-beneficiary',
        ordererAccountNumber: '0987654321',
        ordererName: 'test-orderer',
      };

      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.post.mockReturnValue(of(axiosResponse));

      service
        .initiateCellPhoneDeposit(mockInput)
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockResponse);
            expect(httpService.post).toHaveBeenCalledWith(
              'http://localhost:8080/deposit/initiate-cellphone-deposit',
              mockInput,
            );
            done();
          },
          error: done,
        });
    });

    it('should handle error in initiateCellPhoneDeposit', (done) => {
      const mockInput: InitiateCellPhoneDepositInputDto = {
        beneficiaryPhoneNumber: '1234567890',
        ordererIdentification: 'test-id',
        ipAddress: '',
        deviceId: 'test-device',
        sessionId: 'test-session',
        trackingId: 'test-tracking-id',
        amount: 100,
        reason: 'test-reason',
      };

      httpService.post.mockReturnValue(throwError(() => new Error('HTTP Error')));

      service
        .initiateCellPhoneDeposit(mockInput)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toContain(
              '[INITIATE CELLPHONE DEPOSIT] HTTP Error',
            );
            done();
          },
        });
    });
  });
});

describe('handleGraphQlError', () => {
  class TestService extends RestMsaNbOrqTransactionService {
    public testHandleGraphQlError(operation: string, error: AxiosError): Observable<never> {
      return this.handleGraphQlError(operation, error);
    }
  }

  let service: TestService;

  beforeEach(() => {
    const mockHttpService = {
      post: jest.fn(),
    } as unknown as HttpService;

    const mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:8080'),
    } as unknown as ConfigService;

    service = new TestService(mockHttpService, mockConfigService);
  });

  it('should handle string error response', (done) => {
    const error = {
      message: 'Bad Request from downstream',
      response: {
        status: 400,
        data: 'Bad Request from downstream',
      },
    } as AxiosError;

    service.testHandleGraphQlError('initiate cellphone deposit', error).subscribe({
      next: () => done('Should not succeed'),
      error: (err) => {
        expect(err.message).toContain('[INITIATE CELLPHONE DEPOSIT] Bad Request from downstream');
        expect(err.error_code).toBe('NB_ERR_400');
        done();
      },
    });
  });

  it('should handle object error response with "message"', (done) => {
    const error = {
      message: 'Something went wrong',
      response: {
        status: 500,
        data: {
          message: 'Something went wrong',
        },
      },
    } as AxiosError;

    service.testHandleGraphQlError('initiate cellphone deposit', error).subscribe({
      next: () => done('Should not succeed'),
      error: (err) => {
        expect(err.message).toContain('[INITIATE CELLPHONE DEPOSIT] Something went wrong');
        expect(err.error_code).toBe('NB_ERR_905');
        done();
      },
    });
  });

  it('should handle object error response with "error"', (done) => {
    const error = {
      message: 'Something went wrong',
      response: {
        status: 500,
        data: {
          error: 'Service is unavailable',
        },
      },
    } as AxiosError;

    service.testHandleGraphQlError('initiate cellphone deposit', error).subscribe({
      next: () => done('Should not succeed'),
      error: (err) => {
        expect(err.message).toContain('[INITIATE CELLPHONE DEPOSIT] Service is unavailable');
        expect(err.error_code).toBe('NB_ERR_905');
        done();
      },
    });
  });

  it('should default to error.message if data does not match expected structure', (done) => {
    const error = {
      message: 'Generic error fallback',
      response: {
        status: 500,
        data: {
          unexpected: 'value',
        },
      },
    } as AxiosError;

    service.testHandleGraphQlError('initiate cellphone deposit', error).subscribe({
      next: () => done('Should not succeed'),
      error: (err) => {
        expect(err.message).toContain('[INITIATE CELLPHONE DEPOSIT] Generic error fallback');
        expect(err.error_code).toBe('NB_ERR_905');
        done();
      },
    });
  });

  it('should handle missing response gracefully', (done) => {
    const error = {
      message: 'Network Error',
    } as AxiosError;

    service.testHandleGraphQlError('initiate cellphone deposit', error).subscribe({
      next: () => done('Should not succeed'),
      error: (err) => {
        expect(err.message).toContain('[INITIATE CELLPHONE DEPOSIT] Network Error');
        expect(err.error_code).toBe('NB_ERR_905');
        done();
      },
    });
  });
});

describe('RestMsaNbOrqTransactionService.confirmDeposit', () => {
  let service: RestMsaNbOrqTransactionService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaNbOrqTransactionService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
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

    service = module.get<RestMsaNbOrqTransactionService>(
      RestMsaNbOrqTransactionService,
    );
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    configService.get.mockReturnValue('http://localhost:8080');
  });

  it('should successfully confirm deposit', (done) => {
    const mockInput: ConfirmDepositInputDto = {
      trackingId: 'test-tracking-id',
      transactionId: '1234567890',
      deviceId: 'test-device',
    };

    const expectedBody = {
      transactionId: mockInput.transactionId,
      deviceId: mockInput.deviceId,
    };

    const expectedHeaders = {
      headers: {
        'Content-Type': 'application/json',
        trackingId: mockInput.trackingId,
      },
    };

    const mockResponse: ConfirmDepositResponseDto = {
      status: 'success',
      message: 'Cellphone deposit initiated successfully',
      transactionNumber: 'test-transaction-number',
      transactionDate: '2021-10-01T12:00:00Z',
    };

    const axiosResponse: AxiosResponse = {
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    httpService.post.mockReturnValue(of(axiosResponse));

    service
      .confirmDeposit(mockInput)
      .pipe(first())
      .subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(httpService.post).toHaveBeenCalledWith(
            'http://localhost:8080/deposit/confirm-deposit',
            expectedBody,
            expectedHeaders,
          );
          done();
        },
        error: done,
      });
  });

  it('should handle error in confirmDeposit', (done) => {
    const mockInput: ConfirmDepositInputDto = {
      trackingId: 'test-tracking-id',
      transactionId: '1234567890',
      deviceId: 'test-device',
    };

    httpService.post.mockReturnValue(throwError(() => new Error('HTTP Error')));

    service
      .confirmDeposit(mockInput)
      .pipe(first())
      .subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toContain(
            '[CONFIRM DEPOSIT] HTTP Error',
          );
          done();
        },
      });
  });
});

describe('RestMsaNbOrqTransactionService.validateDepositAccount', () => {
  let service: RestMsaNbOrqTransactionService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaNbOrqTransactionService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
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

    service = module.get<RestMsaNbOrqTransactionService>(
      RestMsaNbOrqTransactionService,
    );
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    configService.get.mockReturnValue('http://localhost:8080');
  });

  it('should successfully validate deposit account', (done) => {
    const mockInput: ValidateDepositAccountInputDto = {
      trackingId: 'test-tracking-id',
      beneficiaryPhoneNumber: '1234567890',
    };

    const expectedBody = {
      beneficiaryPhoneNumber: mockInput.beneficiaryPhoneNumber,
    };

    const mockResponse: ValidateDepositAccountResponseDto = {
      status: 'success',
      message: 'Deposit account successfully validated',
      beneficiaryAccountNumber: '1234567890',
      beneficiaryName: 'test-beneficiary',
    };

    const axiosResponse: AxiosResponse = {
      data: mockResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    httpService.post.mockReturnValue(of(axiosResponse));

    service
      .validateDepositAccount(mockInput)
      .pipe(first())
      .subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(httpService.post).toHaveBeenCalledWith(
            'http://localhost:8080/deposit/validate-deposit-account',
            expectedBody,
          );
          done();
        },
        error: done,
      });
  });

  it('should handle error in validateDepositAccount', (done) => {
    const mockInput: ValidateDepositAccountInputDto = {
      trackingId: 'test-tracking-id',
      beneficiaryPhoneNumber: '1234567890',
    };

    httpService.post.mockReturnValue(throwError(() => new Error('HTTP Error')));

    service
      .validateDepositAccount(mockInput)
      .pipe(first())
      .subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toContain(
            '[VALIDATE DEPOSIT ACCOUNT] HTTP Error',
          );
          done();
        },
      });
  });
});