import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TemplateGeneratorAdapter } from './template-generator.adapter';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

describe('TemplateGeneratorAdapter', () => {
  let adapter: TemplateGeneratorAdapter;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateGeneratorAdapter,
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

    adapter = module.get<TemplateGeneratorAdapter>(TemplateGeneratorAdapter);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should generate a template successfully', async () => {
    const mockTemplateGeneratorUrl = 'http://template-generator-url';
    const mockResponse: AxiosResponse = {
      data: ['mocked-base64-template'],
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: undefined,
      },
    };

    configService.get.mockReturnValue(mockTemplateGeneratorUrl);
    httpService.post.mockReturnValue(of(mockResponse));

    const result = await adapter.generateTemplate(
      'test-template',
      '/path/to/template',
    );

    expect(result).toBe('mocked-base64-template');
    expect(configService.get).toHaveBeenCalledWith('TEMPLATE_GENERATOR_URL');
    expect(httpService.post).toHaveBeenCalledWith(
      mockTemplateGeneratorUrl,
      {
        templateArray: [
          {
            templateName: 'test-template',
            templatePath: '/path/to/template',
            dynamicData: {},
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          trackingid: 'mocked-uuid',
        },
      },
    );
  });

  it('should throw an error when template generation fails', async () => {
    const mockError = new Error('Template generation failed');
    configService.get.mockReturnValue('http://template-generator-url');
    httpService.post.mockReturnValue(throwError(mockError));

    await expect(
      adapter.generateTemplate('test-template', '/path/to/template'),
    ).rejects.toThrow('Error generating template: Template generation failed');
  });
});
