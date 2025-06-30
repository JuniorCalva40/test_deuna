import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { Logger } from '@nestjs/common';
import { RestMsaTlDigisignInvoiceService } from './rest-msa-tl-digisign-invoice.service';
import { GetRucInformationResponseDto } from '../dto/get-ruc-information-response.dto';
import { CreateInvoiceRequestDto } from '../dto/create-invoice-request.dto';
import { CreateInvoiceResponseDto } from '../dto/create-invoice-response.dto';
import { TrackingApiHeaders } from '../../../common/constants/common';

describe('RestMsaTlDigisignInvoiceService', () => {
  let service: RestMsaTlDigisignInvoiceService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockApiUrl = 'http://test-api.com';
  const mockHeaders = {
    [TrackingApiHeaders.SESSION_ID]: 'session-123',
    [TrackingApiHeaders.REQUEST_ID]: 'request-123',
    [TrackingApiHeaders.TRACKING_ID]: 'tracking-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaTlDigisignInvoiceService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'MSA_TL_DIGISIGN_INVOICE_URL') {
                return mockApiUrl;
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaTlDigisignInvoiceService>(
      RestMsaTlDigisignInvoiceService,
    );
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should log an error if API URL is not configured', () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      configService.get.mockReturnValue(undefined);

      new RestMsaTlDigisignInvoiceService(httpService, configService);

      expect(loggerSpy).toHaveBeenCalledWith(
        'MSA_TL_DIGISIGN_INVOICE_URL is not defined',
      );
      loggerSpy.mockRestore();
    });
  });

  describe('getRucInformation', () => {
    it('should return RUC information on success', async () => {
      const ruc = '1234567890';
      const mockResponse: AxiosResponse<GetRucInformationResponseDto> = {
        data: { data: { main: [] } } as GetRucInformationResponseDto,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined } as any,
      };
      httpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getRucInformation(ruc, mockHeaders);

      expect(result).toEqual(mockResponse.data);
      expect(httpService.get).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/ruc/${ruc}`,
        { headers: mockHeaders },
      );
    });

    it('should throw an error on failure', async () => {
      const ruc = '1234567890';
      const error = new Error('API Error');
      httpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getRucInformation(ruc, mockHeaders)).rejects.toThrow(
        'API Error',
      );
    });
  });

  describe('createInvoice', () => {
    it('should return invoice creation response on success', async () => {
      const invoiceData = {} as CreateInvoiceRequestDto;
      const mockResponse: AxiosResponse<CreateInvoiceResponseDto> = {
        data: {
          code: 200,
          message: 'Success',
          error: false,
          access_key: 'key-123',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined } as any,
      };
      httpService.post.mockReturnValue(of(mockResponse));

      const result = await service.createInvoice(invoiceData, mockHeaders);

      expect(result).toEqual(mockResponse.data);
      expect(httpService.post).toHaveBeenCalledWith(
        `${mockApiUrl}/api/v1/invoices`,
        invoiceData,
        { headers: mockHeaders },
      );
    });

    it('should throw an error on failure', async () => {
      const invoiceData = {} as CreateInvoiceRequestDto;
      const error = new Error('API Error');
      httpService.post.mockReturnValue(throwError(() => error));

      await expect(
        service.createInvoice(invoiceData, mockHeaders),
      ).rejects.toThrow('API Error');
    });
  });
});
