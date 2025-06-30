import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { RestMsaTlTemplateGeneratorService } from './rest-msa-tl-template-generator.service';
import { TemplateGeneratorDto } from '../dto/msa-tl-template-generator.dto';

describe('RestMsaTlTemplateGeneratorService', () => {
  let service: RestMsaTlTemplateGeneratorService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaTlTemplateGeneratorService,
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

    service = module.get<RestMsaTlTemplateGeneratorService>(
      RestMsaTlTemplateGeneratorService,
    );
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTemplate', () => {
    const mockTemplate: TemplateGeneratorDto = {
      templateName: 'test-template',
      templatePath: 'test/path',
      dynamicData: { key: 'value' },
    };

    it('should generate template successfully', (done) => {
      const mockResponse = ['<html>Test</html>'];
      const mockAxiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(of(mockAxiosResponse));

      service.generateTemplate(mockTemplate).subscribe({
        next: (result) => {
          expect(result.generatedHtml).toEqual(mockResponse);
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

      service.generateTemplate(mockTemplate).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            'Failed to generate template. Please try again. Test error',
          );
          done();
        },
      });
    }, 10000); // Aumentamos el tiempo de espera a 10 segundos
  });
});
