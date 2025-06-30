import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { RedisService } from '@deuna/tl-cache-nd';
import { RedisElectronicSignatureStorageAdapter } from './redis-electronic-signature-storage.adapter';
import { ElectronicSignatureRequestDto } from '../../../application/dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureUpdateDto } from '../../../application/dto/electronic-signature/electronic-signature-update.dto';

describe('RedisElectronicSignatureStorageAdapter', () => {
  let adapter: RedisElectronicSignatureStorageAdapter;
  let redisService: RedisService;

  const identificationNumber = '0987654321';
  const redisKey = `request:sign:billing:${identificationNumber}`;

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

  const mockUpdateDto: ElectronicSignatureUpdateDto = {
    applicantName: 'Updated Name',
    applicantLastName: 'Updated LastName',
    emailAddress: 'updated@example.com',
    cellphoneNumber: '+593987654322',
  };

  beforeEach(async () => {
    // Create mock for RedisService
    const redisServiceMock = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisElectronicSignatureStorageAdapter,
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
        Logger,
      ],
    }).compile();

    adapter = module.get<RedisElectronicSignatureStorageAdapter>(
      RedisElectronicSignatureStorageAdapter,
    );
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('saveSignatureRequest', () => {
    it('should save signature request successfully', async () => {
      // Arrange
      jest.spyOn(redisService, 'set').mockResolvedValueOnce(undefined);

      // Act
      await adapter.saveSignatureRequest(
        identificationNumber,
        mockSignatureRequestDto,
      );

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        redisKey,
        JSON.stringify(mockSignatureRequestDto),
      );
    });

    it('should throw error when Redis operation fails', async () => {
      // Arrange
      const testError = new Error('Redis connection error');
      jest.spyOn(redisService, 'set').mockRejectedValueOnce(testError);

      // Act & Assert
      await expect(
        adapter.saveSignatureRequest(
          identificationNumber,
          mockSignatureRequestDto,
        ),
      ).rejects.toThrow(`Error saving signature request: ${testError.message}`);
      expect(redisService.set).toHaveBeenCalledWith(
        redisKey,
        JSON.stringify(mockSignatureRequestDto),
      );
    });
  });

  describe('getSignatureRequest', () => {
    it('should get signature request as object successfully', async () => {
      // Arrange
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValueOnce(mockSignatureRequestDto);

      // Act
      const result = await adapter.getSignatureRequest(identificationNumber);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith(redisKey);
      expect(result).toEqual(mockSignatureRequestDto);
    });

    it('should get signature request as JSON string successfully', async () => {
      // Arrange
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValueOnce(JSON.stringify(mockSignatureRequestDto));

      // Act
      const result = await adapter.getSignatureRequest(identificationNumber);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith(redisKey);
      expect(result).toEqual(mockSignatureRequestDto);
    });

    it('should return null when signature request not found', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValueOnce(null);

      // Act
      const result = await adapter.getSignatureRequest(identificationNumber);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith(redisKey);
      expect(result).toBeNull();
    });

    it('should throw error when parsing invalid JSON string', async () => {
      // Arrange
      jest.spyOn(redisService, 'get').mockResolvedValueOnce('{invalid-json}');

      // Act & Assert
      await expect(
        adapter.getSignatureRequest(identificationNumber),
      ).rejects.toThrow('Error parsing signature request data');
      expect(redisService.get).toHaveBeenCalledWith(redisKey);
    });

    it('should throw error when Redis operation fails', async () => {
      // Arrange
      const testError = new Error('Redis connection error');
      jest.spyOn(redisService, 'get').mockRejectedValueOnce(testError);

      // Act & Assert
      await expect(
        adapter.getSignatureRequest(identificationNumber),
      ).rejects.toThrow(testError);
      expect(redisService.get).toHaveBeenCalledWith(redisKey);
    });
  });

  describe('updateSignatureRequest', () => {
    it('should update signature request successfully', async () => {
      // Arrange
      jest
        .spyOn(adapter, 'getSignatureRequest')
        .mockResolvedValueOnce(mockSignatureRequestDto);

      jest.spyOn(redisService, 'set').mockResolvedValueOnce(undefined);

      const expectedUpdatedData = {
        ...mockSignatureRequestDto,
        ...mockUpdateDto,
      };

      // Act
      await adapter.updateSignatureRequest(identificationNumber, mockUpdateDto);

      // Assert
      expect(adapter.getSignatureRequest).toHaveBeenCalledWith(
        identificationNumber,
      );
      expect(redisService.set).toHaveBeenCalledWith(
        redisKey,
        JSON.stringify(expectedUpdatedData),
      );
    });

    it('should throw error when signature request not found', async () => {
      // Arrange
      jest.spyOn(adapter, 'getSignatureRequest').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        adapter.updateSignatureRequest(identificationNumber, mockUpdateDto),
      ).rejects.toThrow(
        `Error updating signature request: No data found in redis db to update for identification: ${identificationNumber}`,
      );
      expect(adapter.getSignatureRequest).toHaveBeenCalledWith(
        identificationNumber,
      );
    });

    it('should throw error when Redis set operation fails', async () => {
      // Arrange
      jest
        .spyOn(adapter, 'getSignatureRequest')
        .mockResolvedValueOnce(mockSignatureRequestDto);

      const testError = new Error('Redis connection error');
      jest.spyOn(redisService, 'set').mockRejectedValueOnce(testError);

      // Act & Assert
      await expect(
        adapter.updateSignatureRequest(identificationNumber, mockUpdateDto),
      ).rejects.toThrow(
        `Error updating signature request: ${testError.message}`,
      );
      expect(adapter.getSignatureRequest).toHaveBeenCalledWith(
        identificationNumber,
      );
    });
  });
});
