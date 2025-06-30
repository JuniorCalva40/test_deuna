import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RestMsaNbCnbAccountValidationService } from './rest-msa-nb-cnb-account-validation.service';
import { FakeMsaNbCnbAccountValidationService } from './fake-msa-nb-cnb-account-validation.service';

describe('RestMsaNbCnbAccountValidationService', () => {
  let service: RestMsaNbCnbAccountValidationService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaNbCnbAccountValidationService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RestMsaNbCnbAccountValidationService>(
      RestMsaNbCnbAccountValidationService,
    );
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);

    mockConfigService.get.mockReturnValue('http://localhost:3001');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAccount', () => {
    it('should successfully validate an active account', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            accountNumber: '123456789',
            accountStatus: 'active',
            balance: 1000.0,
            currency: 'USD',
            isActive: true,
          },
        },
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.validateAccount({
        accountNumber: '123456789',
      });

      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        'http://localhost:3001/api/v1/cnb/account/validate',
        {
          params: { accountNumber: '123456789' },
          headers: { 'Content-Type': 'application/json' },
        },
      );
    });

    it('should throw error for inactive account (404)', async () => {
      const error = {
        response: { status: 404 },
        message: 'Account not found',
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(
        service.validateAccount({ accountNumber: 'INACTIVE123' }),
      ).rejects.toThrow();
    });

    it('should throw error for general validation failure', async () => {
      const error = {
        message: 'Internal server error',
      };

      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(
        service.validateAccount({ accountNumber: '123456789' }),
      ).rejects.toThrow();
    });
  });
});

describe('FakeMsaNbCnbAccountValidationService', () => {
  let service: FakeMsaNbCnbAccountValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FakeMsaNbCnbAccountValidationService],
    }).compile();

    service = module.get<FakeMsaNbCnbAccountValidationService>(
      FakeMsaNbCnbAccountValidationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAccount', () => {
    it('should successfully validate an active account with balance', async () => {
      const result = await service.validateAccount({
        accountNumber: 'ACTIVE_BALANCE_123',
      });

      expect(result.status).toBe('success');
      expect(result.data.isActive).toBe(true);
      expect(result.data.balance).toBe(1000.0);
    });

    it('should return inactive account for account without balance', async () => {
      const result = await service.validateAccount({
        accountNumber: 'ACTIVE_123',
      });

      expect(result.status).toBe('success');
      expect(result.data.isActive).toBe(false);
      expect(result.data.balance).toBe(0.0);
    });

    it('should throw error for inactive account', async () => {
      await expect(
        service.validateAccount({ accountNumber: 'INACTIVE_123' }),
      ).rejects.toThrow();
    });
  });
}); 