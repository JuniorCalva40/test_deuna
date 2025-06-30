import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@deuna/tl-logger-nd';
import { DetokenizeImageUseCase } from './detokenize-image.use-case';
import { DetokenizeClientPort } from '../../ports/out/clients/detokenize-client.port';
import { DetokenizeRequestDto } from '../../dto/detokenize/detokenize-request.dto';
import { DetokenizeResponseDto } from '../../dto/detokenize/detokenize-response.dto';
import { DETOKENIZE_CLIENT_PORT } from '../../../domain/constants/injection.constants';

describe('DetokenizeImageUseCase', () => {
  let useCase: DetokenizeImageUseCase;
  let detokenizeClientMock: jest.Mocked<DetokenizeClientPort>;
  let loggerMock: jest.Mocked<Logger>;

  const mockTrackingData = {
    sessionId: 'test-session-id',
    trackingId: 'test-tracking-id',
    requestId: 'test-request-id',
  };

  const mockToken = 'mock-image-token-123456';

  const mockSuccessResponse: DetokenizeResponseDto = {
    imageData: 'base64-image-data',
    status: 'SUCCESS',
    message: 'Image detokenized successfully',
  };

  const mockErrorResponse: DetokenizeResponseDto = {
    status: 'ERROR',
    message: 'Failed to detokenize image',
    imageData: null,
  };

  beforeEach(async () => {
    // Crear mock para el puerto de detokenización
    detokenizeClientMock = {
      detokenizeImage: jest.fn(),
    } as unknown as jest.Mocked<DetokenizeClientPort>;

    // Crear mock para el logger
    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DetokenizeImageUseCase,
        {
          provide: DETOKENIZE_CLIENT_PORT,
          useValue: detokenizeClientMock,
        },
      ],
    }).compile();

    useCase = module.get<DetokenizeImageUseCase>(DetokenizeImageUseCase);
    // Reemplazar el logger interno con nuestro mock
    (useCase as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully detokenize an image', async () => {
      // Configurar el mock para devolver una respuesta exitosa
      detokenizeClientMock.detokenizeImage.mockResolvedValue(
        mockSuccessResponse,
      );

      // Ejecutar el caso de uso
      const result = await useCase.execute(mockToken, mockTrackingData);

      // Verificar que el método del cliente fue llamado con los parámetros correctos
      expect(detokenizeClientMock.detokenizeImage).toHaveBeenCalledWith(
        expect.any(DetokenizeRequestDto),
        mockTrackingData,
      );

      // Verificar que el token se pasó correctamente en el DTO
      const requestArg = detokenizeClientMock.detokenizeImage.mock.calls[0][0];
      expect(requestArg).toBeInstanceOf(DetokenizeRequestDto);
      expect(requestArg.bestImageToken).toBe(mockToken);

      // Verificar que se devuelve la respuesta correcta
      expect(result).toEqual(mockSuccessResponse);

      // Verificar los logs adecuados
      expect(loggerMock.log).toHaveBeenCalledTimes(2);
      expect(loggerMock.log).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          message: 'Starting image detokenization process',
        }),
      );
      expect(loggerMock.log).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          message: 'Image detokenization process completed successfully',
          status: 'SUCCESS',
        }),
      );
    });

    it('should handle detokenization failure and throw error', async () => {
      // Configurar el mock para lanzar un error
      const mockError = new Error('Detokenization service error');
      detokenizeClientMock.detokenizeImage.mockRejectedValue(mockError);

      // Ejecutar el caso de uso y esperar que lance un error
      await expect(
        useCase.execute(mockToken, mockTrackingData),
      ).rejects.toThrow(mockError);

      // Verificar que el método del cliente fue llamado
      expect(detokenizeClientMock.detokenizeImage).toHaveBeenCalled();

      // Verificar los logs de error
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error during image detokenization process',
          error: mockError.message,
        }),
      );
    });

    it('should handle detokenization service returning error response', async () => {
      // Configurar el mock para devolver una respuesta de error
      detokenizeClientMock.detokenizeImage.mockResolvedValue(mockErrorResponse);

      // Ejecutar el caso de uso
      const result = await useCase.execute(mockToken, mockTrackingData);

      // Verificar que el método del cliente fue llamado
      expect(detokenizeClientMock.detokenizeImage).toHaveBeenCalled();

      // Verificar que se devuelve la respuesta correcta
      expect(result).toEqual(mockErrorResponse);

      // Verificar los logs adecuados
      expect(loggerMock.log).toHaveBeenCalledTimes(2);
      expect(loggerMock.log).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          message: 'Image detokenization process completed successfully',
          status: 'ERROR',
        }),
      );
    });
  });
});
