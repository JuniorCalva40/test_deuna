import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { first } from 'rxjs/operators';
import { AxiosResponse } from 'axios';
import { RestMsaNbOrqTransactionService } from './rest-msa-nb-orq-transaction.service';
import { InitiateDepositInput } from '../dto/msa-nb-orq-transaction-input.dto';

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
      expect(newService['retry']).toBe(2);
      expect(newService['timeout']).toBe(50000);
    });
  });

  describe('initiateDeposit', () => {
    it('should successfully initiate deposit', (done) => {
      const mockInput: InitiateDepositInput = {
        QRid: 'test-id',
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
        .initiateDeposit(mockInput)
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockResponse);
            expect(httpService.post).toHaveBeenCalledWith(
              'http://localhost:8080/api/v1/deposit/initiate',
              mockInput,
            );
            done();
          },
          error: done,
        });
    });

    it('should handle error in InitiateDeposit', (done) => {
      const mockInput: InitiateDepositInput = {
        QRid: 'test-id',
      };

      httpService.post.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service
        .initiateDeposit(mockInput)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              'Failed to initiate deposit in RestMsaNbOrqTransactionService: HTTP Error',
            );
            done();
          },
        });
    });
  });
});
