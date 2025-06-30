import { Test, TestingModule } from '@nestjs/testing';
import { ProcessDigitalSignatureUseCase } from './process-digital-signature.use-case';
import { ElectronicSignatureRequestDto } from '@src/application/dto/electronic-signature/electronic-signature-redis-request.dto';
import { DigitalSignatureRepositoryPort } from '@src/application/ports/out/repository/digital-signature-repository.port';
import { DIGITAL_SIGNATURE_REPOSITORY_PORT } from '@src/domain/constants/injection.constants';
import { ElectronicSignatureProcessResponseDto } from '@src/application/dto/electronic-signature/electronic-signature-process-response.dto';

// Mock del Logger
jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('ProcessDigitalSignatureUseCase', () => {
  let useCase: ProcessDigitalSignatureUseCase;
  let repositoryPort: DigitalSignatureRepositoryPort;

  const mockSignatureRequestDto: ElectronicSignatureRequestDto = {
    identificationNumber: '1712345679',
    applicantName: 'Juan',
    applicantLastName: 'Pérez',
    fingerCode: '2',
    emailAddress: 'juan.perez@ejemplo.com',
    cellphoneNumber: '+593987654321',
    city: 'Quito',
    province: 'Pichincha',
    address: 'Av. República de El Salvador N36-84 y Av. Naciones Unidas',
    fileIdentificationFront: 'data:image/jpeg;base64,test...',
    fileIdentificationBack: 'data:image/jpeg;base64,test...',
    fileIdentificationSelfie: 'data:image/png;base64,test...',
  };

  const mockSessionId = 'session-123456';
  const mockTrackingId = 'tracking-789012';
  const mockRequestId = 'request-345678';

  beforeEach(async () => {
    // Limpiar mocks antes de cada prueba
    jest.clearAllMocks();

    // Crear mock para el puerto del repositorio
    repositoryPort = {
      processDigitalSignature: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessDigitalSignatureUseCase,
        {
          provide: DIGITAL_SIGNATURE_REPOSITORY_PORT,
          useValue: repositoryPort,
        },
      ],
    }).compile();

    useCase = module.get<ProcessDigitalSignatureUseCase>(
      ProcessDigitalSignatureUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should process a digital signature request successfully', async () => {
    // Arrange
    const expectedResult: ElectronicSignatureProcessResponseDto = {
      status: 'PROCESSED',
      message: 'Digital signature processed successfully',
      referenceTransaction: 'DS-12345678',
    };

    jest
      .spyOn(repositoryPort, 'processDigitalSignature')
      .mockResolvedValue(expectedResult);

    // Act
    const result = await useCase.execute(
      mockSignatureRequestDto,
      mockSessionId,
      mockTrackingId,
      mockRequestId,
    );

    // Assert
    expect(repositoryPort.processDigitalSignature).toHaveBeenCalledWith(
      mockSignatureRequestDto,
      mockSessionId,
      mockTrackingId,
      mockRequestId,
    );
    expect(result).toEqual(expectedResult);
  });

  it('should handle errors properly', async () => {
    // Arrange
    const testError = new Error('Test error');
    jest
      .spyOn(repositoryPort, 'processDigitalSignature')
      .mockRejectedValue(testError);

    // Act & Assert
    await expect(
      useCase.execute(
        mockSignatureRequestDto,
        mockSessionId,
        mockTrackingId,
        mockRequestId,
      ),
    ).rejects.toThrow(testError);
    expect(repositoryPort.processDigitalSignature).toHaveBeenCalledWith(
      mockSignatureRequestDto,
      mockSessionId,
      mockTrackingId,
      mockRequestId,
    );
  });

  it('should handle failed digital signature processing', async () => {
    // Arrange
    const failedResult: ElectronicSignatureProcessResponseDto = {
      status: 'FAILED',
      message: 'Error in the response of the digital signature service',
    };

    jest
      .spyOn(repositoryPort, 'processDigitalSignature')
      .mockResolvedValue(failedResult);

    // Act
    const result = await useCase.execute(
      mockSignatureRequestDto,
      mockSessionId,
      mockTrackingId,
      mockRequestId,
    );

    // Assert
    expect(repositoryPort.processDigitalSignature).toHaveBeenCalledWith(
      mockSignatureRequestDto,
      mockSessionId,
      mockTrackingId,
      mockRequestId,
    );
    expect(result).toEqual(failedResult);
    expect(result.status).toBe('FAILED');
    expect(result.message).toBe(
      'Error in the response of the digital signature service',
    );
    expect(result.referenceTransaction).toBeUndefined();
  });
});
