import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RestMsaNbClientService } from './rest-msa-nb-client.service';
import { CreateClientInput } from '../dto/create-client.input';
import { UpdateClientStatusResponse } from '../interfaces/msa-nb-client-service.interface';
import { AxiosResponse } from 'axios';
import { UploadClientsFileResponse } from '../dto/upload-client-file.entity';

describe('RestMsaNbClientService', () => {
  let service: RestMsaNbClientService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

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
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaNbClientService>(RestMsaNbClientService);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    // Mock the ConfigService to return a test URL
    configService.get.mockReturnValue('http://test-api.com/api/v1');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should use default URL if not provided', () => {
      configService.get.mockReturnValue(undefined);
      const newService = new RestMsaNbClientService(httpService, configService);
      expect(configService.get).toHaveBeenCalledWith(
        'MSA_NB_CLIENT_SERVICE_URL',
      );
      expect((newService as any).apiUrl).toBe('http://localhost:8080/api/v1');
    });

    it('should use provided URL', () => {
      const mockUrl = 'http://custom-api.com';
      configService.get.mockReturnValue(mockUrl);
      const newService = new RestMsaNbClientService(httpService, configService);
      expect(configService.get).toHaveBeenCalledWith(
        'MSA_NB_CLIENT_SERVICE_URL',
      );
      expect((newService as any).apiUrl).toBe(mockUrl);
    });
  });

  describe('getClientByIdentification', () => {
    it('should handle errors', (done) => {
      const mockError = new Error('HTTP Error');
      httpService.get.mockReturnValue(throwError(() => mockError));

      service.getClientByIdentification('123').subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toContain(
            'Failed to get client by identification',
          );
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

  describe('updateClientComerceId', () => {
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

      service.updateClientComerceId('1', '123').subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(httpService.patch).toHaveBeenCalledWith(
            'http://localhost:8080/api/v1/clients/1',
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

      service.updateClientComerceId('1', '123').subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toContain('Failed to update client comerce id');
          done();
        },
      });
    });
  });

  describe('updateClientStatus', () => {
    it('should update client status correctly', (done) => {
      const mockResponse: UpdateClientStatusResponse = {
        id: '1',
        comerceId: '123',
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

      service.updateClientStatus('1', 'ACTIVO').subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(httpService.patch).toHaveBeenCalledWith(
            'http://localhost:8080/api/v1/clients/1',
            { status: 'ACTIVO' },
          );
          done();
        },
        error: done,
      });
    });

    it('should handle errors when updating client status', (done) => {
      const mockError = new Error('Error HTTP');
      httpService.patch.mockReturnValue(throwError(() => mockError));

      service.updateClientStatus('1', 'ACTIVO').subscribe({
        next: () => done('No debería tener éxito'),
        error: (error) => {
          expect(error.message).toContain('Failed to update client status');
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
            'http://localhost:8080/api/v1/file/csv',
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
          expect(error.message).toContain('Failed to upload clients file');
          done();
        },
      });
    });
  });
});
