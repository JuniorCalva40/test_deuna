import { Test, TestingModule } from '@nestjs/testing';
import { SaveSignatureRequestUseCase } from './save-signature-request.use-case';
import { ElectronicSignatureRequestDto } from '@src/application/dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureStoragePort } from '@src/application/ports/out/storage/electronic-signature-storage.port';
import { ELECTRONIC_SIGNATURE_STORAGE_PORT } from '@src/domain/constants/injection.constants';

// Mock del Logger
jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('SaveSignatureRequestUseCase', () => {
  let useCase: SaveSignatureRequestUseCase;
  let storagePort: ElectronicSignatureStoragePort;

  const mockSignatureRequestDto: ElectronicSignatureRequestDto = {
    identificationNumber: '0987654321',
    applicantName: 'Test Name',
    applicantLastName: 'Test LastName',
    fingerCode: 'FP123456',
    emailAddress: 'test@example.com',
    cellphoneNumber: '+593987654321',
    city: 'Test City',
    province: 'Test Province',
    address: 'Test Address 123',
    fileIdentificationFront: 'data:image/jpeg;base64,test...',
    fileIdentificationBack: 'data:image/jpeg;base64,test...',
    fileIdentificationSelfie: 'data:image/png;base64,test...',
  };

  beforeEach(async () => {
    // Clean mocks before each test
    jest.clearAllMocks();

    // Create mock for storage port
    storagePort = {
      saveSignatureRequest: jest.fn(),
      updateSignatureRequest: jest.fn(),
      getSignatureRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveSignatureRequestUseCase,
        {
          provide: ELECTRONIC_SIGNATURE_STORAGE_PORT,
          useValue: storagePort,
        },
      ],
    }).compile();

    useCase = module.get<SaveSignatureRequestUseCase>(
      SaveSignatureRequestUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should save a signature request successfully', async () => {
    // Arrange
    const identificationNumber = '0987654321';
    jest
      .spyOn(storagePort, 'saveSignatureRequest')
      .mockResolvedValue(undefined);

    // Act
    await useCase.execute(identificationNumber, mockSignatureRequestDto);

    // Assert
    expect(storagePort.saveSignatureRequest).toHaveBeenCalledWith(
      identificationNumber,
      mockSignatureRequestDto,
    );
  });

  it('should handle errors properly', async () => {
    // Arrange
    const identificationNumber = '0987654321';
    const testError = new Error('Test error');
    jest
      .spyOn(storagePort, 'saveSignatureRequest')
      .mockRejectedValue(testError);

    // Act & Assert
    await expect(
      useCase.execute(identificationNumber, mockSignatureRequestDto),
    ).rejects.toThrow(testError);
    expect(storagePort.saveSignatureRequest).toHaveBeenCalledWith(
      identificationNumber,
      mockSignatureRequestDto,
    );
  });
});
