import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { FileManagerRequest } from '../../../domain/types/document-types';
import { FileStorageError } from '../../../application/errors/document-generation-errors';
import { FileManagerAdapter } from './file-manager.adapter';

describe('FileManagerAdapter', () => {
  let adapter: FileManagerAdapter;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileManagerAdapter,
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

    adapter = module.get<FileManagerAdapter>(FileManagerAdapter);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should store a file successfully', async () => {
    const mockAxiosResponse: AxiosResponse = {
      data: {
        signedUrl: 'http://example.com/stored-file',
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    const fileManagerUrl = 'http://file-manager-url';
    const fileName = 'test.pdf';
    const fileData: FileManagerRequest = {
      origin: 'deuna-co',
      processName: 'test-process',
      fileName: fileName,
      mimeType: 'application/pdf',
      tags: ['tag1', 'tag2'],
      description: 'Test file',
      identificationId: '123456',
      referenceId: 'ref-123',
      extension: 'pdf',
      trackingId: 'tracking-123',
      metadata: { commerceId: 'commerce-123' },
    };

    jest.spyOn(configService, 'get').mockReturnValue(fileManagerUrl);
    jest.spyOn(httpService, 'post').mockReturnValue(of(mockAxiosResponse));

    const result = await adapter.storeFile(fileName, fileData);

    expect(result).toEqual({ signedUrl: 'http://example.com/stored-file' });
    expect(configService.get).toHaveBeenCalledWith('FILE_MANAGER_URL');
    expect(httpService.post).toHaveBeenCalledWith(fileManagerUrl, fileData);
  });

  it('should throw FileStorageError when HTTP request fails', async () => {
    const error = new Error('HTTP Error');
    jest.spyOn(configService, 'get').mockReturnValue('http://file-manager-url');
    jest.spyOn(httpService, 'post').mockImplementation(() => {
      throw error;
    });

    const fileName = 'test.pdf';
    const fileData: FileManagerRequest = {
      origin: 'deuna-co',
      processName: 'test-process',
      fileName: fileName,
      mimeType: 'application/pdf',
      tags: ['tag1', 'tag2'],
      description: 'Test file',
      identificationId: '123456',
      referenceId: 'ref-123',
      extension: 'pdf',
      trackingId: 'tracking-123',
      metadata: { commerceId: 'commerce-123' },
    };

    await expect(adapter.storeFile(fileName, fileData)).rejects.toThrow(
      FileStorageError,
    );
  });

  it('should use the correct URL from config', async () => {
    const fileManagerUrl = 'http://custom-file-manager-url';
    jest.spyOn(configService, 'get').mockReturnValue(fileManagerUrl);
    jest.spyOn(httpService, 'post').mockReturnValue(
      of({
        data: { signedUrl: 'http://example.com/stored-file' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      }),
    );

    const fileName = 'test.pdf';
    const fileData: FileManagerRequest = {
      origin: 'deuna-co',
      processName: 'test-process',
      fileName: fileName,
      mimeType: 'application/pdf',
      tags: [],
      description: '',
      identificationId: '',
      referenceId: '',
      extension: 'pdf',
      trackingId: '',
      metadata: {
        commerceId: '',
      },
    };

    await adapter.storeFile(fileName, fileData);

    expect(configService.get).toHaveBeenCalledWith('FILE_MANAGER_URL');
    expect(httpService.post).toHaveBeenCalledWith(fileManagerUrl, fileData);
  });
});
