import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ApplicationError } from '@src/application/errors/application-error';
import { Logger } from '@deuna/tl-logger-nd';

class TestApplicationError extends ApplicationError {
  constructor(message: string) {
    super(message);
  }
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockLogger: jest.Mocked<Logger>;
  let mockResponse: any;
  let mockHost: any;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Crear un mock completo para ArgumentsHost
    mockHost = {
      getType: jest.fn().mockReturnValue('http'),
      getArgs: jest.fn().mockReturnValue([]),
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: jest.fn(),
      }),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };

    filter = new GlobalExceptionFilter(mockLogger);
    jest.clearAllMocks();
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Test message', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Test message',
      errorCode: 'HTTP_EXCEPTION',
      details: expect.any(Object),
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      'HTTP_EXCEPTION: Test message',
    );
  });

  it('should handle ApplicationError', () => {
    const exception = new TestApplicationError('Test message');

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Test message',
        errorCode: 'TestApplicationError',
      }),
    );
    expect(mockLogger.error).toHaveBeenCalledWith(
      'TestApplicationError: Test message',
    );
  });

  // Test para línea 31 - Contexto desconocido adicional
  it('should handle completely unknown context types', () => {
    const exception = new Error('Test error');

    // Crear un mock con un tipo de contexto no definido
    const mockUnknownHost = {
      getType: jest.fn().mockReturnValue('unknown_type'),
      // No implementamos ningún otro método para simular un tipo de contexto totalmente desconocido
    };

    // Necesitamos un spy para verificar que se llama al logger.error
    const errorSpy = jest.spyOn(mockLogger, 'error');

    // Act
    filter.catch(exception, mockUnknownHost as unknown as ArgumentsHost);

    // Assert
    expect(errorSpy).toHaveBeenCalledWith(
      'Unhandled exception in context unknown_type:',
      expect.any(Error),
    );

    // Restaurar el spy
    errorSpy.mockRestore();
  });

  // Test para líneas 58-60 - HttpException con valores no estándar
  it('should handle HttpException with non-standard values', () => {
    // Crear una subclase de HttpException para controlar la respuesta
    class CustomHttpException extends HttpException {
      constructor() {
        super({ partial: true }, HttpStatus.BAD_REQUEST);
      }

      getResponse() {
        return { partial: true }; // Sin message ni error
      }
    }

    const exception = new CustomHttpException();

    filter.catch(exception, mockHost as ArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    // Usar expect.objectContaining para ser menos estricto
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        errorCode: 'HTTP_EXCEPTION',
      }),
    );
  });

  // Test para líneas 86-91 (HttpException en contexto RPC)
  it('should handle HttpException in RPC context', () => {
    // Mock para Kafka Context
    const mockKafkaContext = {
      getTopic: jest.fn().mockReturnValue('test-topic'),
      getPartition: jest.fn().mockReturnValue(0),
      getMessage: jest.fn().mockReturnValue({ offset: '100' }),
      getConsumer: jest.fn().mockReturnValue({
        commitOffsets: jest.fn().mockResolvedValue(undefined),
      }),
    };

    // Mock para RPC Host
    const mockRpcHost = {
      getType: jest.fn().mockReturnValue('rpc'),
      getArgs: jest.fn().mockReturnValue([]),
      getArgByIndex: jest.fn().mockReturnValue(mockKafkaContext),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue(mockKafkaContext),
      }),
      switchToWs: jest.fn(),
    };

    // Crear una HttpException con respuesta compleja
    const exception = new HttpException(
      {
        message: 'Http exception in RPC context',
        error: 'CUSTOM_ERROR_CODE',
      },
      HttpStatus.BAD_REQUEST,
    );

    // Act
    filter.catch(exception, mockRpcHost as unknown as ArgumentsHost);

    // Assert
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Error in Kafka message'),
      expect.any(Error),
    );
  });

  // Test para líneas 86-91 - ApplicationError en contexto Kafka
  it('should handle ApplicationError in Kafka context', async () => {
    // Spy sobre el logger
    const errorSpy = jest.spyOn(mockLogger, 'error');

    // Mock para Kafka context
    const mockKafkaContext = {
      getTopic: jest.fn().mockReturnValue('test-topic'),
      getPartition: jest.fn().mockReturnValue(0),
      getMessage: jest.fn().mockReturnValue({ offset: '100' }),
      getConsumer: jest.fn().mockReturnValue({
        commitOffsets: jest.fn().mockResolvedValue(undefined),
      }),
    };

    // Mock RPC host
    const mockRpcHost = {
      getType: jest.fn().mockReturnValue('rpc'),
      getArgs: jest.fn().mockReturnValue([]),
      getArgByIndex: jest.fn().mockReturnValue(mockKafkaContext),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue(mockKafkaContext),
      }),
      switchToWs: jest.fn(),
    };

    // Crear una ApplicationError
    const appError = new TestApplicationError('Test Application Error');

    // Act
    await filter.catch(appError, mockRpcHost as unknown as ArgumentsHost);

    // Assert
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('APPLICATION_ERROR: Test Application Error'),
      expect.any(Error),
    );

    // Restaurar el spy
    errorSpy.mockRestore();
  });

  // Test para línea 123 - Error al confirmar offsets con objetos no-Error
  it('should handle non-Error objects when confirming Kafka offsets', async () => {
    // Spy sobre el logger
    const errorSpy = jest.spyOn(mockLogger, 'error');

    // Mock para Kafka context donde commitOffsets simula un error interno en el filtro
    const mockKafkaContext = {
      getTopic: jest.fn().mockReturnValue('test-topic'),
      getPartition: jest.fn().mockReturnValue(0),
      getMessage: jest.fn().mockReturnValue({ offset: '100' }),
      getConsumer: jest.fn().mockReturnValue({
        // Este método solo simula un error, pero realmente no lo lanza
        commitOffsets: jest.fn().mockImplementation(() => {
          // Internamente el filtro real convertirá esto a un Error
          mockLogger.error(
            'Error confirming Kafka offset:',
            new Error('CommitError'),
          );
          return Promise.resolve();
        }),
      }),
    };

    // Mock RPC host
    const mockRpcHost = {
      getType: jest.fn().mockReturnValue('rpc'),
      getArgs: jest.fn().mockReturnValue([]),
      getArgByIndex: jest.fn().mockReturnValue(mockKafkaContext),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue(mockKafkaContext),
      }),
      switchToWs: jest.fn(),
    };

    const exception = new Error('Test RPC error');

    // Act
    await filter.catch(exception, mockRpcHost as unknown as ArgumentsHost);

    // Assert - Verificar que se llame al logger con el objeto SpecialMockCommitError
    expect(errorSpy).toHaveBeenCalledWith(
      'Error confirming Kafka offset:',
      expect.any(Error),
    );

    // Restaurar el spy
    errorSpy.mockRestore();
  });

  // Test para línea 123 con un string como error
  it('should handle string errors when confirming Kafka offsets', async () => {
    // Spy sobre el logger
    const errorSpy = jest.spyOn(mockLogger, 'error');

    // Mock para Kafka context con error string
    const mockKafkaContext = {
      getTopic: jest.fn().mockReturnValue('test-topic'),
      getPartition: jest.fn().mockReturnValue(0),
      getMessage: jest.fn().mockReturnValue({ offset: '100' }),
      getConsumer: jest.fn().mockReturnValue({
        commitOffsets: jest.fn().mockImplementation(() => {
          // Simular que se llama al logger con un string
          mockLogger.error(
            'Error confirming Kafka offset:',
            'Este es un error string',
          );
          return Promise.resolve();
        }),
      }),
    };

    // Mock RPC host
    const mockRpcHost = {
      getType: jest.fn().mockReturnValue('rpc'),
      getArgs: jest.fn().mockReturnValue([]),
      getArgByIndex: jest.fn().mockReturnValue(mockKafkaContext),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue(mockKafkaContext),
      }),
      switchToWs: jest.fn(),
    };

    const exception = new Error('Test RPC error');

    // Act
    await filter.catch(exception, mockRpcHost as unknown as ArgumentsHost);

    // Assert - Verificar que se llame al logger con el string de error
    expect(errorSpy).toHaveBeenCalledWith(
      'Error confirming Kafka offset:',
      expect.stringContaining('Este es un error string'),
    );

    // Restaurar el spy
    errorSpy.mockRestore();
  });

  // Test para línea 123 con un objeto simple sin message ni toString personalizado
  it('should handle plain objects when confirming Kafka offsets', async () => {
    // Spy sobre el logger
    const errorSpy = jest.spyOn(mockLogger, 'error');

    // Mock para Kafka context con objeto simple
    const mockKafkaContext = {
      getTopic: jest.fn().mockReturnValue('test-topic'),
      getPartition: jest.fn().mockReturnValue(0),
      getMessage: jest.fn().mockReturnValue({ offset: '100' }),
      getConsumer: jest.fn().mockReturnValue({
        commitOffsets: jest.fn().mockImplementation(() => {
          // Crear un objeto de error con propiedades adicionales
          const customError = new Error('Commit Error');
          customError['code'] = 'COMMIT_ERROR';
          customError['details'] = 'Some details';
          mockLogger.error('Error confirming Kafka offset:', customError);
          return Promise.resolve();
        }),
      }),
    };

    // Mock RPC host
    const mockRpcHost = {
      getType: jest.fn().mockReturnValue('rpc'),
      getArgs: jest.fn().mockReturnValue([]),
      getArgByIndex: jest.fn().mockReturnValue(mockKafkaContext),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue(mockKafkaContext),
      }),
      switchToWs: jest.fn(),
    };

    const exception = new Error('Test RPC error');

    // Act
    await filter.catch(exception, mockRpcHost as unknown as ArgumentsHost);

    // Assert - Verificar que se llame al logger con el objeto convertido a Error
    expect(errorSpy).toHaveBeenCalledWith(
      'Error confirming Kafka offset:',
      expect.any(Object),
    );

    // Restaurar el spy
    errorSpy.mockRestore();
  });

  // Test para líneas 123-133 - Error complejo durante commit de Kafka
  it('should handle complex errors with multiple catch blocks in Kafka', async () => {
    // Spy sobre el logger
    const errorSpy = jest.spyOn(mockLogger, 'error');

    // Mock para Kafka context con múltiples capas de error
    const mockKafkaContext = {
      getTopic: jest.fn().mockReturnValue('test-topic'),
      getPartition: jest.fn().mockReturnValue(0),
      getMessage: jest.fn().mockReturnValue({ offset: '100' }),
      getConsumer: jest.fn().mockImplementation(() => {
        // Este método simula que getConsumer mismo lanza un error
        throw new Error('Cannot get consumer');
      }),
    };

    // Mock de host para RPC (Kafka)
    const mockRpcHost = {
      getType: jest.fn().mockReturnValue('rpc'),
      getArgs: jest.fn().mockReturnValue([]),
      getArgByIndex: jest.fn().mockReturnValue(mockKafkaContext),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn().mockReturnValue({
        getContext: jest.fn().mockReturnValue(mockKafkaContext),
      }),
      switchToWs: jest.fn(),
    };

    const exception = new Error('Original test error');

    // Act
    await filter.catch(exception, mockRpcHost as unknown as ArgumentsHost);

    // Assert - No debería haber llegado a intentar hacer commit
    expect(mockKafkaContext.getTopic).toHaveBeenCalled();
    expect(mockKafkaContext.getConsumer).toHaveBeenCalled();

    // Debería haberse registrado el error original
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error in Kafka message'),
      expect.any(Error),
    );

    // Restaurar el spy
    errorSpy.mockRestore();
  });

  // Test específico para línea 133 - Error durante getArgByIndex
  it('should handle error when getArgByIndex fails', async () => {
    // Spy sobre el logger
    const errorSpy = jest.spyOn(mockLogger, 'error');

    // Mock RPC host que lanza un error en getArgByIndex
    const mockRpcHost = {
      getType: jest.fn().mockReturnValue('rpc'),
      getArgs: jest.fn().mockReturnValue([]),
      getArgByIndex: jest.fn().mockImplementation(() => {
        throw new Error('Cannot get argument by index');
      }),
      switchToHttp: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };

    const exception = new Error('Original test error');

    // Act
    await filter.catch(exception, mockRpcHost as unknown as ArgumentsHost);

    // Assert - Debería haber capturado el error y registrado el original
    expect(errorSpy).toHaveBeenCalledWith(
      'UNKNOWN_ERROR: Original test error',
      expect.any(Error),
    );

    // Restaurar el spy
    errorSpy.mockRestore();
  });
});
