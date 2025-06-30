import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RestMsaMcBoClientService } from './rest-msa-mc-bo-client.service';
import {
  ClientDataInput,
  ClientDataResponse,
} from '../dto/msa-mc-bo-client.dto';
import { AxiosResponse } from 'axios';

describe('RestMsaMcBoClientService', () => {
  let service: RestMsaMcBoClientService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaMcBoClientService,
        {
          provide: HttpService,
          useValue: {
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

    service = module.get<RestMsaMcBoClientService>(RestMsaMcBoClientService);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClientData', () => {
    const mockInput: ClientDataInput = {
      identification: '7701151770',
    };

    it('should get client data successfully', (done) => {
      const mockResponse: ClientDataResponse = {
        clientAcountId: '123',
        id: '456',
      };
      const mockAxiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      configService.get.mockReturnValue('http://URL');
      httpService.get.mockReturnValue(of(mockAxiosResponse));

      service.getClientData(mockInput).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(httpService.get).toHaveBeenCalledWith(
            'http://URL/client/ruc/7701151770',
          );
          done();
        },
        error: done,
      });
    });

    it('should throw error when API URL is not defined', () => {
      configService.get.mockReturnValue(undefined);

      expect(() => service.getClientData(mockInput)).toThrow(
        'MSA_MC_BO_CLIENT_SERVICE_URL is not defined',
      );
    });

    it('should handle API errors', (done) => {
      configService.get.mockReturnValue('http://test-url');
      httpService.get.mockReturnValue(throwError(() => new Error('API Error')));

      service.getClientData(mockInput).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe('API Error');
          done();
        },
      });
    });
  });
});
