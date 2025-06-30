import { Test, TestingModule } from '@nestjs/testing';
import { UploadClientsFileService } from './upload-clients-file.service';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-client/providers/msa-nb-client-service.provider';
import { of, throwError } from 'rxjs';
import { ErrorHandler } from '../../../utils/error-handler.util';

describe('UploadClientsFileService', () => {
  let service: UploadClientsFileService;
  let mockMsaNbClientService: jest.Mocked<any>;

  beforeEach(async () => {
    mockMsaNbClientService = {
      uploadClientsFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadClientsFileService,
        {
          provide: MSA_NB_CLIENT_SERVICE,
          useValue: mockMsaNbClientService,
        },
      ],
    }).compile();

    service = module.get<UploadClientsFileService>(UploadClientsFileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadClientsFile', () => {
    const mockFile = {
      createReadStream: jest.fn(),
      mimetype: 'text/csv',
    };

    const mockFileContent = Buffer.from('test,data,content');

    beforeEach(() => {
      mockFile.createReadStream.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield mockFileContent;
        },
      });
    });

    it('should successfully upload and process CSV file', async () => {
      // Arrange
      const mockUploadResponse = {
        totalProcessed: 10,
        skippedRecords: ['record1', 'record2'],
      };

      mockMsaNbClientService.uploadClientsFile.mockReturnValue(
        of(mockUploadResponse),
      );

      // Act
      const result = await service.uploadClientsFile(
        Promise.resolve(mockFile as any),
      );

      // Assert
      expect(result).toEqual({
        status: 'SUCCESS',
        message: 'Archivo procesado exitosamente',
        totalProcessed: mockUploadResponse.totalProcessed,
        skippedRecords: mockUploadResponse.skippedRecords,
      });
      expect(mockMsaNbClientService.uploadClientsFile).toHaveBeenCalledWith(
        mockFileContent.toString('base64'),
      );
    });

    it('should handle non-CSV file type', async () => {
      // Arrange
      const invalidFile = {
        ...mockFile,
        mimetype: 'application/pdf',
      };

      jest.spyOn(ErrorHandler, 'handleError').mockImplementation((message) => {
        throw new Error(message);
      });

      // Act & Assert
      await expect(
        service.uploadClientsFile(Promise.resolve(invalidFile as any)),
      ).rejects.toThrow('El archivo debe ser un CSV');

      expect(mockMsaNbClientService.uploadClientsFile).not.toHaveBeenCalled();
    });

    it('should handle null upload response', async () => {
      // Arrange
      mockMsaNbClientService.uploadClientsFile.mockReturnValue(of(null));

      jest.spyOn(ErrorHandler, 'handleError').mockImplementation((message) => {
        throw new Error(message);
      });

      // Act & Assert
      await expect(
        service.uploadClientsFile(Promise.resolve(mockFile as any)),
      ).rejects.toThrow('Error al cargar el archivo de clientes');
    });

    it('should handle upload service error', async () => {
      // Arrange
      const mockError = new Error('Upload service error');
      mockMsaNbClientService.uploadClientsFile.mockReturnValue(
        throwError(() => mockError),
      );

      jest.spyOn(ErrorHandler, 'handleError').mockImplementation((error) => {
        throw error;
      });

      // Act & Assert
      await expect(
        service.uploadClientsFile(Promise.resolve(mockFile as any)),
      ).rejects.toThrow('Upload service error');
    });

    it('should handle file read error', async () => {
      // Arrange
      const mockReadError = new Error('File read error');
      mockFile.createReadStream.mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          throw mockReadError;
        },
      });

      jest.spyOn(ErrorHandler, 'handleError').mockImplementation((error) => {
        throw error;
      });

      // Act & Assert
      await expect(
        service.uploadClientsFile(Promise.resolve(mockFile as any)),
      ).rejects.toThrow('File read error');

      expect(mockMsaNbClientService.uploadClientsFile).not.toHaveBeenCalled();
    });
  });
});
