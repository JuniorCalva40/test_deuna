import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';
import { DigitalSignatureAdapter } from './digital-signature.adapter';
import { ElectronicSignatureRequestDto } from '../../../application/dto/electronic-signature/electronic-signature-redis-request.dto';
import { ElectronicSignatureProcessResponseDto } from '../../../application/dto/electronic-signature/electronic-signature-process-response.dto';
import {
  CommunicationError,
  ConnectionRefusedError,
  DnsResolutionError,
} from '../../../application/errors/external-service-error';
import { DigitalSignatureSuccessResponse } from '../../../application/dto/electronic-signature/electronic-signature-external-service-response.dto';

// Mock del Logger
jest.mock('@deuna/tl-logger-nd', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

// Mock de todas las clases de error
jest.mock('../../../application/errors/external-service-error', () => {
  const original = jest.requireActual(
    '../../../application/errors/external-service-error',
  );
  return {
    ...original,
    CommunicationError: jest
      .fn()
      .mockImplementation(function (message, details, endpoint) {
        this.message = message;
        this.details = details;
        this.endpoint = endpoint;
        this.name = 'CommunicationError';
      }),
    ConnectionRefusedError: jest
      .fn()
      .mockImplementation(function (message, details, endpoint) {
        this.message = message;
        this.details = details;
        this.endpoint = endpoint;
        this.name = 'ConnectionRefusedError';
      }),
    DnsResolutionError: jest
      .fn()
      .mockImplementation(function (message, details, endpoint) {
        this.message = message;
        this.details = details;
        this.endpoint = endpoint;
        this.name = 'DnsResolutionError';
      }),
  };
});

describe('DigitalSignatureAdapter', () => {
  let adapter: DigitalSignatureAdapter;
  let httpService: HttpService;
  let configService: ConfigService;
  const mockApiUrl = 'http://test-api.example.com';

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
  const mockEndpoint = `${mockApiUrl}/api/v1/digital-signatures`;

  beforeEach(async () => {
    // Limpiar mocks antes de cada prueba
    jest.clearAllMocks();

    // Crear mocks
    httpService = {
      post: jest.fn(),
    } as unknown as HttpService;

    configService = {
      get: jest.fn().mockImplementation((key) => {
        if (key === 'MSA_TL_DIGISIGN_INVOICE_URL') {
          return mockApiUrl;
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DigitalSignatureAdapter,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    adapter = module.get<DigitalSignatureAdapter>(DigitalSignatureAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should use the configured API URL from environment', () => {
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_TL_DIGISIGN_INVOICE_URL',
    );
  });

  it('should throw an error if MSA_TL_DIGISIGN_INVOICE_URL is not configured', async () => {
    // Arreglar configService para que devuelva undefined
    jest.spyOn(configService, 'get').mockReturnValueOnce(undefined);

    // Actuar y Afirmar
    expect(() => {
      new DigitalSignatureAdapter(httpService, configService);
    }).toThrow('MSA_TL_DIGISIGN_INVOICE_URL is not configured');
  });

  it('should process a digital signature request successfully', async () => {
    // Arrange
    const mockSuccessResponse: DigitalSignatureSuccessResponse = {
      status: 'success',
      message: 'OK',
      data: {
        response: 'Firma generada correctamente',
        referenceTransaction: 'DS-12345678',
      },
      referenceTransaction: 'DS-12345678',
    };

    const mockResponse: AxiosResponse = {
      status: 200,
      data: mockSuccessResponse,
      headers: {},
      config: {
        url: '',
        headers: {},
      } as any,
      statusText: 'OK',
    };

    jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

    // Act
    const result = await adapter.processDigitalSignature(
      mockSignatureRequestDto,
      mockSessionId,
      mockTrackingId,
      mockRequestId,
    );

    // Assert
    expect(httpService.post).toHaveBeenCalledWith(
      mockEndpoint,
      mockSignatureRequestDto,
      {
        headers: {
          'Content-Type': 'application/json',
          sessionId: mockSessionId,
          trackingId: mockTrackingId,
          requestId: mockRequestId,
        },
      },
    );

    const expectedResult: ElectronicSignatureProcessResponseDto = {
      status: 'PROCESSED',
      message: 'Digital signature processed successfully',
      referenceTransaction: 'DS-12345678',
    };

    expect(result).toEqual(expectedResult);
  });

  it('should handle error response with status 200', async () => {
    // Arrange
    const mockErrorResponse = {
      status: 'error',
      message: 'Código de la huella inválido.',
      data: {
        errorCode: 'HTTP_500',
        endpoint:
          'https://firmas-intuito-test.azurewebsites.net/v2/firma-intuito/generar-firma',
        responseData: {
          code: 500,
          message: 'Código de la huella inválido.',
          error: true,
        },
      },
    };

    const mockResponse: AxiosResponse = {
      status: 200,
      data: mockErrorResponse,
      headers: {},
      config: {
        url: '',
        headers: {},
      } as any,
      statusText: 'OK',
    };

    jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

    // Act
    const result = await adapter.processDigitalSignature(
      mockSignatureRequestDto,
      mockSessionId,
      mockTrackingId,
      mockRequestId,
    );

    // Assert
    const expectedFailedResult: ElectronicSignatureProcessResponseDto = {
      status: 'FAILED',
      message: 'Error in the response of the digital signature service',
    };

    expect(result).toEqual(expectedFailedResult);
  });

  it('should handle HTTP errors properly', async () => {
    // Arrange
    const mockError = new Error('HTTP Error');
    jest
      .spyOn(httpService, 'post')
      .mockReturnValue(throwError(() => mockError));

    // Act & Assert
    await expect(
      adapter.processDigitalSignature(
        mockSignatureRequestDto,
        mockSessionId,
        mockTrackingId,
        mockRequestId,
      ),
    ).rejects.toBeInstanceOf(CommunicationError);
  });

  it('should handle ECONNREFUSED errors correctly', async () => {
    // Arrange
    const mockAxiosError = new AxiosError('Connection refused');
    mockAxiosError.code = 'ECONNREFUSED';
    mockAxiosError.request = {};

    jest
      .spyOn(httpService, 'post')
      .mockReturnValue(throwError(() => mockAxiosError));

    // Act & Assert
    await expect(
      adapter.processDigitalSignature(
        mockSignatureRequestDto,
        mockSessionId,
        mockTrackingId,
        mockRequestId,
      ),
    ).rejects.toBeInstanceOf(ConnectionRefusedError);
  });

  it('should handle ENOTFOUND errors correctly', async () => {
    // Arrange
    const mockAxiosError = new AxiosError('DNS resolution error');
    mockAxiosError.code = 'ENOTFOUND';
    mockAxiosError.request = {};

    jest
      .spyOn(httpService, 'post')
      .mockReturnValue(throwError(() => mockAxiosError));

    // Act & Assert
    await expect(
      adapter.processDigitalSignature(
        mockSignatureRequestDto,
        mockSessionId,
        mockTrackingId,
        mockRequestId,
      ),
    ).rejects.toBeInstanceOf(DnsResolutionError);
  });
});
