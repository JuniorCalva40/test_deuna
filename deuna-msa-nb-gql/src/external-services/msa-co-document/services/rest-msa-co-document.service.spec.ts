import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { RestMsaCoDocumentService } from './rest-msa-co-document.service';
import { GenerateDocumentDto } from '../dto/msa-co-document.dto';

describe('RestMsaCoDocumentService', () => {
  let service: RestMsaCoDocumentService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaCoDocumentService,
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

    service = module.get<RestMsaCoDocumentService>(RestMsaCoDocumentService);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDocument', () => {
    const mockDocument: GenerateDocumentDto = {
      commerceId: 'test-commerce-id',
      htmlTemplate: '<html>Test</html>',
      description: 'Test description',
      identification: 'test-id',
      fileName: 'test-file',
      processName: 'test-process',
      mimeType: 'application/pdf',
      extension: 'pdf',
      tags: ['test'],
    };

    it('should generate document successfully', (done) => {
      const mockResponse = {
        status: 'success',
        data: [{ signedUrl: 'test-url' }],
      };
      const mockAxiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(of(mockAxiosResponse));

      service.generateDocument(mockDocument).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          done();
        },
        error: done,
      });
    });

    it('should handle errors', (done) => {
      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(
        throwError(() => new Error('Test error')),
      );

      service.generateDocument(mockDocument).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            'Failed to generate document in RestMsaCoDocumentService: Test error',
          );
          done();
        },
      });
    });
  });
});
