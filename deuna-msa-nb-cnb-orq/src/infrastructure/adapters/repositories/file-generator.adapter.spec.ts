import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FileGeneratorAdapter } from './file-generator.adapter';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { FileGenerationError } from '../../../application/errors/document-generation-errors';

describe('FileGeneratorAdapter', () => {
  let adapter: FileGeneratorAdapter;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileGeneratorAdapter,
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

    adapter = module.get<FileGeneratorAdapter>(FileGeneratorAdapter);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should generate a file successfully', async () => {
    const mockAxiosResponse: AxiosResponse = {
      data: {
        b64encoded: 'base64string',
        presignedUrl: 'http://example.com/file',
        message: 'File generated successfully',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    jest
      .spyOn(configService, 'get')
      .mockReturnValue('http://file-generator-url');
    jest.spyOn(httpService, 'post').mockReturnValue(of(mockAxiosResponse));

    const result = await adapter.generateFile(
      'content',
      'file.pdf',
      'tracking-id',
      'application/pdf',
      'pdf',
      'process-name',
      {
        documentNumber: '123',
        detailAttached: 'details',
        commerceId: 'commerce-id',
      },
    );

    expect(result).toEqual({
      b64encoded: 'base64string',
      presignedUrl: 'http://example.com/file',
      message: 'File generated successfully',
    });
    expect(httpService.post).toHaveBeenCalledWith(
      'http://file-generator-url',
      expect.objectContaining({
        content: ['content'],
        fileName: 'file.pdf',
        mimeType: 'application/pdf',
        extension: 'pdf',
        trackingId: 'tracking-id',
      }),
    );
  });

  // New test to cover the error case (line 51)
  it('should throw FileGenerationError when file generation fails', async () => {
    const errorMessage = 'File generation failed';
    jest
      .spyOn(configService, 'get')
      .mockReturnValue('http://file-generator-url');
    jest
      .spyOn(httpService, 'post')
      .mockReturnValue(throwError(() => new Error(errorMessage)));

    await expect(
      adapter.generateFile(
        'content',
        'file.pdf',
        'tracking-id',
        'application/pdf',
        'pdf',
        'process-name',
        {
          documentNumber: '123',
          detailAttached: 'details',
          commerceId: 'commerce-id',
        },
      ),
    ).rejects.toThrow(FileGenerationError);

    await expect(
      adapter.generateFile(
        'content',
        'file.pdf',
        'tracking-id',
        'application/pdf',
        'pdf',
        'process-name',
        {
          documentNumber: '123',
          detailAttached: 'details',
          commerceId: 'commerce-id',
        },
      ),
    ).rejects.toThrow('Error generating file: File generation failed');
  });
});
