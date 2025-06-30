/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@deuna/tl-kafka-nd';
import { RestMsaMcBoHierarchyService } from './rest-msa-mc-bo-hierarchy.service';
import { of, throwError } from 'rxjs';
import {
  FilterHierarchyResponseDto,
  registerStatus,
} from '../dto/filter-hierarchy.dto';
import { AxiosResponse } from 'axios';

describe('RestMsaMcBoHierarchyService', () => {
  let service: RestMsaMcBoHierarchyService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let kafkaService: jest.Mocked<KafkaService>;
  const baseUrl = 'http://test-url/hierarchy';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaMcBoHierarchyService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key, defaultValue) => {
              if (key === 'HIERARCHY_SERVICE_URL') {
                return baseUrl;
              }
              return defaultValue;
            }),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            publishToQueue: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaMcBoHierarchyService>(
      RestMsaMcBoHierarchyService,
    );
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    kafkaService = module.get(KafkaService) as jest.Mocked<KafkaService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHierarchyNodes', () => {
    const clientId = 'test-client-id';
    const mockResponse: FilterHierarchyResponseDto = {
      items: [
        {
          id: 1,
          clientId: 'test-client-id',
          nodeType: 'S',
          status: registerStatus.ACTIVE,
          createdAt: '2023-01-01T00:00:00Z',
          createdBy: 'test-user',
          updatedAt: '2023-01-01T00:00:00Z',
          updatedBy: 'test-user',
          origin: 'test-origin',
          children: [],
        },
      ],
      meta: {
        totalItems: 1,
        itemCount: 1,
        itemsPerPage: 10,
        totalPages: 1,
        currentPage: 1,
      },
      links: {
        first: 'test-first-link',
        previous: 'test-previous-link',
        next: 'test-next-link',
        last: 'test-last-link',
      },
    };

    it('should fetch hierarchy nodes successfully', (done) => {
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://test-url' } as any,
      };

      httpService.get.mockReturnValue(of(axiosResponse));

      // Verificar que la URL base se establece correctamente
      expect(service['HIERARCHY_BASE_URL']).toBe(baseUrl);

      const expectedUrl = `${baseUrl}/hierarchy?clientId=${clientId}&nodeType=M&status=A&page=1&limit=10`;

      service.getHierarchyNodes(clientId).subscribe({
        next: (response) => {
          expect(response).toEqual(mockResponse);
          expect(httpService.get).toHaveBeenCalledWith(expectedUrl);
          done();
        },
        error: (error) => done(error),
      });
    });

    it('should handle errors when fetching hierarchy nodes', (done) => {
      const errorMessage = 'Network error';
      const error = new Error(errorMessage);

      httpService.get.mockReturnValue(throwError(() => error));

      service.getHierarchyNodes(clientId).subscribe({
        next: () => done('Should not succeed'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should log success message when data is fetched successfully', (done) => {
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'http://test-url' } as any,
      };

      httpService.get.mockReturnValue(of(axiosResponse));

      // Espiamos el método log del logger
      const logSpy = jest.spyOn(service['logger'], 'log');

      service.getHierarchyNodes(clientId).subscribe({
        next: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining(
              'Successfully fetched hierarchy data for filters',
            ),
          );
          done();
        },
        error: (error) => done(error),
      });
    });

    it('should log error message when fetching fails', (done) => {
      const errorMessage = 'Network error';
      const error = new Error(errorMessage);

      httpService.get.mockReturnValue(throwError(() => error));

      // Espiamos el método error del logger
      const errorSpy = jest.spyOn(service['logger'], 'error');

      service.getHierarchyNodes(clientId).subscribe({
        next: () => done('Should not succeed'),
        error: () => {
          expect(errorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Error fetching hierarchy data from'),
            error.stack,
          );
          done();
        },
      });
    });
  });
});
