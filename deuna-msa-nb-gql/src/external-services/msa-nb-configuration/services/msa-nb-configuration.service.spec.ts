import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RestMsaNbConfigurationService } from './rest-msa-nb-configuration.service';
import { DataConfigurationInputDto } from '../dto/msa-nb-configuration-input.dto';
import { DataConfigurationResponse } from '../dto/msa-nb-configuration-response.dto';
import { AxiosResponse } from 'axios';

describe('RestMsaNbConfigurationService', () => {
  let service: RestMsaNbConfigurationService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaNbConfigurationService,
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

    service = module.get<RestMsaNbConfigurationService>(
      RestMsaNbConfigurationService,
    );
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveDataConfiguration', () => {
    it('should save data configuration successfully', (done) => {
      const mockInput: DataConfigurationInputDto = {
        configKey: 'testKey',
        configData: {
          fullAddress: 'Test Address',
          numberEstablishment: '123',
        },
        cnbClientId: 'test-client-id',
        updatedBy: 'testUser',
        createdBy: 'testUser',
      };

      const mockResponse: DataConfigurationResponse = {
        id: 'test-id',
        configKey: 'testKey',
        configData: {
          fullAddress: 'Test Address',
          numberEstablishment: '123',
        },
        cnbClientId: 'test-client-id',
        enabled: true,
      };

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
      httpService.post.mockReturnValue(of(axiosResponse));

      service.saveDataConfiguration(mockInput).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(httpService.post).toHaveBeenCalledWith(
            'http://localhost:8080/api/v1/client-config',
            mockInput,
          );
          done();
        },
        error: done,
      });
    });

    it('should throw error when MSA_NB_CONFIGURATION_URL is not defined', () => {
      configService.get.mockReturnValue(undefined);

      expect(() =>
        service.saveDataConfiguration({} as DataConfigurationInputDto),
      ).toThrow(`Cannot read properties of undefined (reading 'pipe')`);
    });

    it('should handle http error', (done) => {
      const mockInput: DataConfigurationInputDto = {
        configKey: 'testKey',
        configData: {
          fullAddress: 'Test Address',
          numberEstablishment: '123',
        },
        cnbClientId: 'test-client-id',
        updatedBy: 'testUser',
        createdBy: 'testUser',
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service.saveDataConfiguration(mockInput).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            'Failed to method post saveDataConfiguration in RestMsaNbConfigurationService: HTTP Error',
          );
          done();
        },
      });
    });

    it('should log error response details', (done) => {
      const mockInput: DataConfigurationInputDto = {
        configKey: 'testKey',
        configData: {
          fullAddress: 'Test Address',
          numberEstablishment: '123',
        },
        cnbClientId: 'test-client-id',
        updatedBy: 'testUser',
        createdBy: 'testUser',
      };

      const errorResponse = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        },
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(throwError(() => errorResponse));

      const loggerErrorSpy = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation();

      service.saveDataConfiguration(mockInput).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            'Failed to method post saveDataConfiguration in RestMsaNbConfigurationService: undefined',
          );
          expect(loggerErrorSpy).toHaveBeenCalledWith(
            'saveDataConfiguration failed in RestMsaNbConfigurationService: undefined',
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
