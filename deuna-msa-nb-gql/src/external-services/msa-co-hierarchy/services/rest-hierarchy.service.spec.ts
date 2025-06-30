/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@deuna/tl-kafka-nd';
import { RestHierarchyService } from './rest-hierarchy.service';
import { HierarchyMetadataUpdateDto } from '../dto/hierarchy-metadata-update.dto';
import { of, throwError } from 'rxjs';

describe('RestHierarchyService', () => {
  let service: RestHierarchyService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let kafkaService: jest.Mocked<KafkaService>;
  const baseUrl = 'http://test-url/hierarchy';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestHierarchyService,
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

    service = module.get<RestHierarchyService>(RestHierarchyService);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    kafkaService = module.get(KafkaService) as jest.Mocked<KafkaService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateMetadata', () => {
    const mockData: HierarchyMetadataUpdateDto = {
      nodeId: '123',
      nodeType: 'COMMERCE',
      updatedBy: 'test-user',
      metadata: {
        cnbId: 'test-cnb-id',
      },
      trackingId: 'test-tracking-id',
    };

    it('should successfully publish metadata update to Kafka', (done) => {
      kafkaService.publishToQueue.mockResolvedValue(undefined);

      service.updateMetadata(mockData).subscribe({
        next: () => {
          expect(kafkaService.publishToQueue).toHaveBeenCalledWith(
            expect.objectContaining({
              topic: 'MI_HIERARCHY_METADATA_UPDATE',
              value: mockData,
            }),
          );
          done();
        },
        error: done,
      });
    });

    it('should handle Kafka publishing errors', (done) => {
      const error = new Error('Kafka error');
      kafkaService.publishToQueue.mockRejectedValue(error);

      service.updateMetadata(mockData).subscribe({
        next: () => done('Should not succeed'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should include required headers in Kafka message', (done) => {
      kafkaService.publishToQueue.mockResolvedValue(undefined);

      service.updateMetadata(mockData).subscribe({
        next: () => {
          expect(kafkaService.publishToQueue).toHaveBeenCalledWith(
            expect.objectContaining({
              headers: expect.objectContaining({
                source: 'leap-x/nb-gql',
                timestamp: expect.any(String),
              }),
            }),
          );
          done();
        },
        error: done,
      });
    });
  });
});
