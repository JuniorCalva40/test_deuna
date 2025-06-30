import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { RestMsaCoTransferOrchestrationService } from './rest-msa-co-transfer-orchestration.service';
import { ValidateBalanceInput } from '../dto/msa-co-transfer-orchestration-input.dto';

describe('RestMsaCoTransferOrchestrationService', () => {
  let service: RestMsaCoTransferOrchestrationService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaCoTransferOrchestrationService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
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

    service = module.get<RestMsaCoTransferOrchestrationService>(
      RestMsaCoTransferOrchestrationService,
    );
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateBalance', () => {
    const mockValidateBalanceInput: ValidateBalanceInput = {
      accountId: '12345679',
    };

    it('should validate balance successfully', (done) => {
      const mockValidateBalanceResponse = {
        status: 'success',
        data: [{ signedUrl: 'test-url' }],
      };
      const mockAxiosResponse: AxiosResponse = {
        data: mockValidateBalanceResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.get.mockReturnValue(of(mockAxiosResponse));

      service.validateBalance(mockValidateBalanceInput).subscribe({
        next: (result) => {
          expect(result).toEqual(mockValidateBalanceResponse);
          done();
        },
        error: done,
      });
    });

    it('should handle errors', (done) => {
      configService.get.mockReturnValue('http://test-url');
      httpService.get.mockReturnValue(
        throwError(() => new Error('Test error')),
      );

      service.validateBalance(mockValidateBalanceInput).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            'Failed to validate balance in RestMsaCoTransferOrchestrationService: Test error',
          );
          done();
        },
      });
    });
  });
});
