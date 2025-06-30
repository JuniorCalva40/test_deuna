import { Test, TestingModule } from '@nestjs/testing';
import { MsaTlBpDataProviderService } from './msa-tl-bp-data-provider.service';
import { BlackListRequestDTO } from '../dto/black-list-request.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { ErrorCodes } from '../../../common/constants/error-codes';

describe('MsaTlBpDataProviderService', () => {
  let service: MsaTlBpDataProviderService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const blackListRequestDto: BlackListRequestDTO = {
    sessionId: '04e77274-1f1f-4b7e-84e9-8df69fd1a291',
    identification: '1718275801',
    fullName: 'Sanguano  Mantilla David Alejandro',
    blackListOption: 'PLAPP,PROV',
    trackingId: '04e77274-1f1f-4b7e-84e9-8df69fd1a291',
  };

  const noBlackListResult = {
    result: [
      {
        blackListType: blackListRequestDto.blackListOption,
        isUserOnBlackList: false,
      },
    ],
  };

  const blackListResult = {
    result: [
      {
        blackListType: blackListRequestDto.blackListOption,
        isUserOnBlackList: true,
        error: 'message-error',
      },
    ],
  };

  const apiResponse: AxiosResponse = {
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: undefined },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MsaTlBpDataProviderService,
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

    service = module.get<MsaTlBpDataProviderService>(
      MsaTlBpDataProviderService,
    );
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should logged a error default URL if not provided', () => {
    configService.get.mockReturnValue(undefined);
    const newService = new MsaTlBpDataProviderService(
      httpService,
      configService,
    );
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_TL_BP_DATA_PROVIDER_SERVICE_URL',
    );
    expect((newService as any).apiUrl).toBe(undefined);
  });

  it('should use provided URL', () => {
    const mockUrl = 'http://custom-api.com';
    configService.get.mockReturnValue(mockUrl);
    const newService = new MsaTlBpDataProviderService(
      httpService,
      configService,
    );
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_TL_BP_DATA_PROVIDER_SERVICE_URL',
    );
    expect((newService as any).apiUrl).toBe(mockUrl);
  });

  it('should call validateBlacklist when cnb is NOT in blacklist', (done) => {
    const mockUrl = 'http://custom-api.com';

    configService.get.mockReturnValue(mockUrl);
    httpService.post.mockReturnValue(
      of({
        ...apiResponse,
        data: noBlackListResult,
      }),
    );
    service.validateBlacklist(blackListRequestDto).subscribe({
      next: (response) => {
        expect(response).toBeDefined();
        expect(httpService.post).toHaveBeenCalledTimes(1);
        expect(response.result[0].isUserOnBlackList).toBe(false);
        done();
      },
      error: done,
    });
  });

  it('should call validateBlacklist when cnb is in blacklist', (done) => {
    const mockUrl = 'http://custom-api.com';

    configService.get.mockReturnValue(mockUrl);
    httpService.post.mockReturnValue(
      of({
        ...apiResponse,
        data: blackListResult,
      }),
    );
    service.validateBlacklist(blackListRequestDto).subscribe({
      next: (response) => {
        expect(response).toBeDefined();
        expect(httpService.post).toHaveBeenCalledTimes(1);
        expect(response.result[0].isUserOnBlackList).toBe(true);
        expect(response.result[0].error).toBe('message-error');
        done();
      },
      error: done,
    });
  });

  it('should handle errors when validateBlacklist is called', (done) => {
    const errorMessage = 'Error occurred while getting CNB transactions';
    const mockError = {
      message: 'Something went wrong Error HTTP',
      response: {
        data: {
          message: errorMessage,
        },
      },
    };
    httpService.post.mockReturnValue(throwError(() => mockError));

    service.validateBlacklist(blackListRequestDto).subscribe({
      next: () => done(),
      error: (error) => {
        expect(error.message).toContain(errorMessage);
        done();
      },
    });
  });

  it('should handle Bad request error when validateBlacklist is called', (done) => {
    const errorMessage = 'Error occurred while getting CNB transactions';
    const mockError = {
      response: {
        data: {
          message: errorMessage,
          details: 'Something went wrong',
        },
        status: 400,
      },
    };
    httpService.post.mockReturnValue(throwError(() => mockError));

    service.validateBlacklist(blackListRequestDto).subscribe({
      next: done,
      error: (error) => {
        expect(error.message).toEqual(
          'Error occurred while getting CNB transactions',
        );
        expect(error.code).toEqual(ErrorCodes.TL_BP_DATA_PROVIDER_ERROR);
        done();
      },
    });
  });
});
