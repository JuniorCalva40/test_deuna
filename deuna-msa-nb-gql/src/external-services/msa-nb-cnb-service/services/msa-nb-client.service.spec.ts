import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RestMsaNbClientService } from './rest-msa-nb-client.service';
import { CreateClientInput } from '../dto/create-client.input';
import { UpdateClientStatusResponse } from '../interfaces/msa-nb-client-service.interface';
import { AxiosError, AxiosResponse } from 'axios';
import { UploadClientsFileResponse } from '../dto/upload-client-file.entity';

describe('RestMsaNbClientService', () => {
  let service: RestMsaNbClientService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  const baseApiUrl = 'http://test-api.com/api/v1'; // Defin base URL for consistency

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaNbClientService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
            patch: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'MSA_NB_CLIENT_SERVICE_URL') {
                return baseApiUrl;
              }
              return undefined; // Default for other config keys if any
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaNbClientService>(RestMsaNbClientService);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should use default URL if MSA_NB_CLIENT_SERVICE_URL is not provided in config', () => {
      // Override the specific mock for this test
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'MSA_NB_CLIENT_SERVICE_URL') {
          return undefined; // Simulate not finding the URL in config
        }
        return undefined;
      });
      const newService = new RestMsaNbClientService(httpService, configService);
      expect(configService.get).toHaveBeenCalledWith(
        'MSA_NB_CLIENT_SERVICE_URL',
      );
      expect((newService as any).apiUrl).toBe('http://localhost:8080/api/v1'); // Service's internal default
    });

    it('should use provided URL from config', () => {
      // The beforeEach already sets this up, but we can be explicit for clarity
      (configService.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'MSA_NB_CLIENT_SERVICE_URL') {
          return 'http://custom-api.com';
        }
        return undefined;
      });
      const newService = new RestMsaNbClientService(httpService, configService);
      expect((newService as any).apiUrl).toBe('http://custom-api.com');
    });
  });

  describe('getClientByIdentification', () => {
    it('should handle errors and log response details if present', (done) => {
      const mockResponseData = { message: 'Internal server error details' };
      const mockAxiosError = new AxiosError(
        'HTTP Error',
        'ECONNREFUSED',
        undefined, // config
        undefined, // request
        {
          // response
          data: mockResponseData,
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
      );

      httpService.get.mockReturnValue(throwError(() => mockAxiosError));
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');

      service.getClientByIdentification('123').subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toContain(
            'Failed to get client by identification in RestMsaNbClientService: HTTP Error',
          );
          expect(loggerErrorSpy).toHaveBeenCalledWith(
            `get client by identification failed in RestMsaNbClientService: ${mockAxiosError.message}`,
          );
          expect(loggerErrorSpy).toHaveBeenCalledWith(
            `Response status: ${mockAxiosError.response.status}`,
          );
          expect(loggerErrorSpy).toHaveBeenCalledWith(
            `Response data: ${JSON.stringify(mockAxiosError.response.data)}`,
          );
          loggerErrorSpy.mockRestore();
          done();
        },
      });
    });
  });

  describe('createClient', () => {
    it('should handle errors', (done) => {
      const mockInput: CreateClientInput = {
        email: 'test@test.com',
      } as CreateClientInput;
      const mockError = new Error('HTTP Error');
      httpService.post.mockReturnValue(throwError(() => mockError));

      service.createClient(mockInput).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toContain('Failed to create client');
          done();
        },
      });
    });
  });

  describe('updateClientData', () => {
    it('should update client commerce id', (done) => {
      const mockResponse: UpdateClientStatusResponse = {
        id: '1',
        comerceId: '123',
        status: 'UPDATED',
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      service.updateClientData('1', '123').subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(httpService.patch).toHaveBeenCalledWith(
            `${baseApiUrl}/clients/1`,
            { comerceId: '123' },
          );
          done();
        },
        error: done,
      });
    });

    it('should handle errors', (done) => {
      const mockError = new Error('HTTP Error');
      httpService.patch.mockReturnValue(throwError(() => mockError));

      service.updateClientData('1', '123').subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toContain('Failed to update client comerce id');
          done();
        },
      });
    });
  });

  describe('updateClientStatus', () => {
    const mockComerceId = 'test-comerce-id';

    it('should update client status correctly (no optional fields)', (done) => {
      const mockResponse: UpdateClientStatusResponse = {
        id: '1',
        comerceId: mockComerceId,
        status: 'ACTIVO',
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      service
        .updateClientStatus({
          clientId: '1',
          status: 'ACTIVO',
        })
        .subscribe({
          next: (response) => {
            expect(response).toEqual(mockResponse);
            expect(httpService.patch).toHaveBeenCalledWith(
              `${baseApiUrl}/clients/1`,
              { status: 'ACTIVO' },
            );
            done();
          },
          error: done,
        });
    });

    it('should update client status with blockedTmpAt', (done) => {
      const testDate = new Date().toISOString();
      const mockResponse: UpdateClientStatusResponse = {
        id: '1',
        comerceId: mockComerceId,
        status: 'BLOCKED_TMP',
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      service
        .updateClientStatus({
          clientId: '1',
          status: 'BLOCKED_TMP',
          blockedTmpAt: testDate,
        })
        .subscribe({
          next: (response) => {
            expect(response).toEqual(mockResponse);
            expect(httpService.patch).toHaveBeenCalledWith(
              `${baseApiUrl}/clients/1`,
              { status: 'BLOCKED_TMP', blockedTmpAt: testDate },
            );
            done();
          },
          error: done,
        });
    });

    it('should update client status with remainingAttemptsOnb', (done) => {
      const mockResponse: UpdateClientStatusResponse = {
        id: '1',
        comerceId: mockComerceId,
        status: 'PENDING',
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      service
        .updateClientStatus({
          clientId: '1',
          status: 'PENDING',
          remainingAttemptsOnb: 2,
        })
        .subscribe({
          next: (response) => {
            expect(response).toEqual(mockResponse);
            expect(httpService.patch).toHaveBeenCalledWith(
              `${baseApiUrl}/clients/1`,
              { status: 'PENDING', remainingAttemptsOnb: 2 },
            );
            done();
          },
          error: done,
        });
    });

    it('should update client status with both blockedTmpAt and remainingAttemptsOnb', (done) => {
      const testDate = new Date().toISOString();
      const mockResponse: UpdateClientStatusResponse = {
        id: '1',
        comerceId: mockComerceId,
        status: 'BLOCKED_TMP',
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      service
        .updateClientStatus({
          clientId: '1',
          status: 'BLOCKED_TMP',
          blockedTmpAt: testDate,
          remainingAttemptsOnb: 0,
        })
        .subscribe({
          next: (response) => {
            expect(response).toEqual(mockResponse);
            expect(httpService.patch).toHaveBeenCalledWith(
              `${baseApiUrl}/clients/1`,
              {
                status: 'BLOCKED_TMP',
                blockedTmpAt: testDate,
                remainingAttemptsOnb: 0,
              },
            );
            done();
          },
          error: done,
        });
    });

    it('should handle errors when updating client status', (done) => {
      const mockError = new Error('Error HTTP');
      httpService.patch.mockReturnValue(throwError(() => mockError));

      service
        .updateClientStatus({
          clientId: '1',
          status: 'ACTIVO',
        })
        .subscribe({
          next: () => done('No debería tener éxito'),
          error: (error) => {
            expect(error.message).toContain(
              'Failed to updateClientStatus in RestMsaNbClientService: Error HTTP',
            );
            done();
          },
        });
    });
  });

  describe('uploadClientsFile', () => {
    it('should upload clients file correctly', (done) => {
      const mockResponse: UploadClientsFileResponse = {
        message: 'Archivo cargado exitosamente',
        totalProcessed: 10,
        skippedRecords: [],
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: undefined },
      };

      httpService.post.mockReturnValue(of(axiosResponse));

      service.uploadClientsFile('contenido_del_archivo').subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(httpService.post).toHaveBeenCalledWith(
            `${baseApiUrl}/file/csv`,
            { file: 'contenido_del_archivo' },
          );
          done();
        },
        error: done,
      });
    });

    it('should handle errors when uploading clients file', (done) => {
      const mockError = new Error('Error HTTP');
      httpService.post.mockReturnValue(throwError(() => mockError));

      service.uploadClientsFile('contenido_del_archivo').subscribe({
        next: () => done('No debería tener éxito'),
        error: (error) => {
          expect(error.message).toContain(
            'Failed to uploadClientsFile in RestMsaNbClientService: Error HTTP',
          );
          done();
        },
      });
    });
  });
});
