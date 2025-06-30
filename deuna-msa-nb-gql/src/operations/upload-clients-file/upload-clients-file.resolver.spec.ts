/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { UploadClientsFileResolver } from './upload-clients-file.resolver';
import { UploadClientsFileService } from './service/upload-clients-file.service';
import { FileUpload } from 'graphql-upload-ts';

describe('UploadClientsFileResolver', () => {
  let resolver: UploadClientsFileResolver;
  let service: jest.Mocked<UploadClientsFileService>;

  beforeEach(async () => {
    const mockUploadClientsFileService = {
      uploadClientsFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadClientsFileResolver,
        {
          provide: UploadClientsFileService,
          useValue: mockUploadClientsFileService,
        },
      ],
    }).compile();

    resolver = module.get<UploadClientsFileResolver>(UploadClientsFileResolver);
    service = module.get(UploadClientsFileService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('uploadClientsFile', () => {
    const createMockFileUpload = (
      filename: string,
      mimetype: string,
    ): Promise<FileUpload> => {
      return Promise.resolve({
        filename,
        mimetype,
        encoding: '7bit',
        createReadStream: jest.fn().mockReturnValue({
          _read: jest.fn(),
          pipe: jest.fn(),
          on: jest.fn(),
          destroy: jest.fn(),
        }),
        capacitor: {
          write: jest.fn(),
          end: jest.fn(),
          destroy: jest.fn(),
          on: jest.fn(),
          once: jest.fn(),
          removeListener: jest.fn(),
          pipe: jest.fn(),
          unpipe: jest.fn(),
        },
      } as unknown as FileUpload);
    };

    const mockResponse = {
      status: 'SUCCESS',
      message: 'Archivo procesado exitosamente',
      totalProcessed: 10,
      skippedRecords: ['record1', 'record2'],
    };

    it('should successfully upload a CSV file', async () => {
        const mockFile = await createMockFileUpload('test.csv', 'text/csv');
      service.uploadClientsFile.mockResolvedValue(mockResponse);

      const result = await resolver.uploadClientsFile(
        Promise.resolve(mockFile),
      );

        expect(result).toEqual(mockResponse);
      expect(service.uploadClientsFile).toHaveBeenCalled();

      const serviceArg = service.uploadClientsFile.mock.calls[0][0];
      const resolvedServiceArg = await serviceArg;
      expect(resolvedServiceArg).toEqual(mockFile);
      });

    it('should throw an error for non-CSV file', async () => {
      const invalidFile = await createMockFileUpload('test.txt', 'text/plain');

      await expect(
        resolver.uploadClientsFile(Promise.resolve(invalidFile)),
      ).rejects.toThrow(
        'Error al procesar el archivo: El archivo debe ser un CSV válido',
      );
      expect(service.uploadClientsFile).not.toHaveBeenCalled();
    });

    it('should handle undefined file', async () => {
      await expect(
        resolver.uploadClientsFile(Promise.resolve(undefined)),
      ).rejects.toThrow(
        'Error al procesar el archivo: El archivo debe ser un CSV válido',
      );
      expect(service.uploadClientsFile).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      const mockFile = await createMockFileUpload('test.csv', 'text/csv');
      const error = new Error('Service error');
      service.uploadClientsFile.mockRejectedValue(error);

      await expect(
        resolver.uploadClientsFile(Promise.resolve(mockFile)),
      ).rejects.toThrow('Service error');

      expect(service.uploadClientsFile).toHaveBeenCalled();

      const serviceArg = service.uploadClientsFile.mock.calls[0][0];
      const resolvedServiceArg = await serviceArg;
      expect(resolvedServiceArg).toEqual(mockFile);
      });

    it('should validate file mimetype before calling service', async () => {
      const invalidFile = await createMockFileUpload(
        'test.pdf',
        'application/pdf',
      );

      await expect(
        resolver.uploadClientsFile(Promise.resolve(invalidFile)),
      ).rejects.toThrow(
        'Error al procesar el archivo: El archivo debe ser un CSV válido',
      );
      expect(service.uploadClientsFile).not.toHaveBeenCalled();
    });
  });
});
