import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, of, throwError } from 'rxjs';
import { first } from 'rxjs/operators';
import { AxiosResponse } from 'axios';
import { RestMsaCoOnboardingStatusService } from './rest-msa-co-onboarding-status.service';
import {
  FingeprintCodeInputDto,
  InitOnboardingInputDto,
  DocumentValidationInputDto,
  StartOnboardingInputDto,
  UpdateDataOnboardingInputDto,
  SetStepAcceptContractInputDto,
} from '../dto/msa-co-onboarding-status-input.dto';
import {
  OnboardingStatusResponseDto,
  GetStateOnboardingResponseDto,
  InitOnboardingResponseDto,
  GetAllOnboardingResponseDto,
  ClientData,
} from '../dto/msa-co-onboarding-status-response.dto';

describe('RestMsaCoOnboardingStatusService', () => {
  let service: RestMsaCoOnboardingStatusService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaCoOnboardingStatusService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
            patch: jest.fn(),
            get: jest.fn(),
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

    service = module.get<RestMsaCoOnboardingStatusService>(
      RestMsaCoOnboardingStatusService,
    );
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);

    configService.get.mockReturnValue('http://localhost:8080');
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set default values if config is not provided', () => {
      configService.get.mockReturnValue(undefined);
      const newService = new RestMsaCoOnboardingStatusService(
        httpService,
        configService,
      );
      expect(newService['apiUrl']).toBe('http://localhost:8080');
      expect(newService['retry']).toBe(2);
      expect(newService['timeout']).toBe(50000);
    });
  });

  describe('initOnboarding', () => {
    it('should successfully initiate onboarding', (done) => {
      const mockInput: InitOnboardingInputDto = {
        identityId: 'test-id',
        onbType: 'test-type',
        securitySeed: 'test-seed',
        publicKey: 'test-key',
      };
      const mockResponse: InitOnboardingResponseDto = {
        sessionId: 'test-session',
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.post.mockReturnValue(of(axiosResponse));

      service
        .initOnboarding(mockInput)
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockResponse);
            expect(httpService.post).toHaveBeenCalledWith(
              'http://localhost:8080/status',
              mockInput,
            );
            done();
          },
          error: done,
        });
    });

    it('should handle error in initOnboarding', (done) => {
      const mockInput: InitOnboardingInputDto = {
        identityId: 'test-id',
        onbType: 'test-type',
        securitySeed: 'test-seed',
        publicKey: 'test-key',
      };

      httpService.post.mockReturnValue(
        throwError(() => new Error('HTTP Error')),
      );

      service
        .initOnboarding(mockInput)
        .pipe(first())
        .subscribe({
          next: () => done('Should not succeed'),
          error: (error) => {
            expect(error.message).toBe(
              `Failed to initiate onboarding in RestMsaCoOnboardingStatusService: HTTP Error`,
            );
            done();
          },
        });
    });
  });

  describe('startOnboarding', () => {
    it('should successfully start onboarding', (done) => {
      const mockInput: StartOnboardingInputDto = {
        sessionId: 'test-session',
        status: 'SUCCESS',
        data: {
          companyName: 'Test Company',
          ruc: {
            rucNumber: '1234',
            estadoContribuyenteRuc: 'ACTIVO',
            actividadEconomicaPrincipal: 'some activity',
            tipoContribuyente: 'some type',
            regimen: 'some regimen',
            categoria: 'some category',
            obligadoLlevarContabilidad: 'si',
            agenteRetencion: 'no',
            contribuyenteEspecial: 'no',
            informacionFechasContribuyente: {
              fechaInicioActividades: 'some date',
              fechaCese: 'some date',
              fechaReinicioActividades: 'some date',
              fechaActualizacion: 'some date',
            },
            addit: [],
          },
          fullName: 'Test User',
          username: 'test-username',
          establishment: [],
          email: 'test@test.com',
          trackingId: 'fb176755-a4dd-4a87-91d7-27801433ad16',
        },
      };
      const mockResponse: OnboardingStatusResponseDto = {
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'SUCCESS',
        onbType: 'CNB',
        sessionId: 'test-session',
        securitySeed: 'test-seed',
        identityId: 'test-id',
        publicKey: 'test-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      service
        .startOnboarding(mockInput)
        .pipe(first())
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockResponse);
            expect(httpService.patch).toHaveBeenCalledWith(
              'http://localhost:8080/status/test-session/start-onb-cnb',
              mockInput,
            );
            done();
          },
          error: done,
        });
    });
  });

  describe('updateOnboardingState', () => {
    it('should successfully update onboarding state', async () => {
      const confirmDataInput: UpdateDataOnboardingInputDto = {
        sessionId: 'test-session',
        status: 'SUCCESS',
        data: {
          status: 'SUCCESS',
        },
      };

      const mockResponse: OnboardingStatusResponseDto = {
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'SUCCESS',
        onbType: 'CNB',
        sessionId: 'test-session',
        securitySeed: 'test-seed',
        identityId: 'test-id',
        publicKey: 'test-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      const result = await firstValueFrom(
        service.updateOnboardingState(confirmDataInput, 'confirm-data'),
      );

      expect(result).toEqual(mockResponse);
      expect(httpService.patch).toHaveBeenCalledWith(
        'http://localhost:8080/status/test-session/confirm-data',
        confirmDataInput,
      );
    });
  });

  describe('setStepAcceptContract', () => {
    it('should successfully set accept contract step', async () => {
      const acceptContractInput: SetStepAcceptContractInputDto = {
        sessionId: 'test-session-id',
        deviceName: 'test-device-name',
        requestId: 'req-123',
        email: 'test@test.com',
        commerceName: 'Test Commerce',
        status: 'SUCCESS',
      };

      const mockResponse: OnboardingStatusResponseDto = {
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'SUCCESS',
        onbType: 'CNB',
        sessionId: 'test-session-id',
        securitySeed: 'test-seed',
        identityId: 'test-id',
        publicKey: 'test-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.patch.mockReturnValue(of(axiosResponse));

      const result = await firstValueFrom(
        service.setStepAcceptContract(acceptContractInput),
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('setFingerprintStep', () => {
    it('should successfully set fingerprint step', async () => {
      const data: FingeprintCodeInputDto = {
        sessionId: 'test-session-id',
        status: 'SUCCESS',
        data: {
          nationalID: '123456789',
          fingerprintData: 'fingerprint-data',
        },
      };
      const mockResponse: OnboardingStatusResponseDto = {
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'SUCCESS',
        onbType: 'CNB',
        sessionId: 'test-session-id',
        securitySeed: 'test-seed',
        identityId: 'test-id',
        publicKey: 'test-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const axiosResponse: AxiosResponse<OnboardingStatusResponseDto> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.patch.mockReturnValue(of(axiosResponse));
      const result = await firstValueFrom(service.setFingerprintStep(data));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('setDocumentValidationStep', () => {
    it('should successfully set document validation step', async () => {
      const data: DocumentValidationInputDto = {
        sessionId: 'test-session-id',
        status: 'SUCCESS',
        data: {
          frontsideImage: 'front-image-data',
          backsideImage: 'back-image-data',
          scanReference: 'test-scan-ref',
          timestamp: new Date().toISOString(),
          type: 'ID',
        },
      };
      const mockResponse: OnboardingStatusResponseDto = {
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'SUCCESS',
        onbType: 'CNB',
        sessionId: 'test-session-id',
        securitySeed: 'test-seed',
        identityId: 'test-id',
        publicKey: 'test-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const axiosResponse: AxiosResponse<OnboardingStatusResponseDto> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.patch.mockReturnValue(of(axiosResponse));
      const result = await firstValueFrom(
        service.setDocumentValidationStep(data),
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('setStepValidateOtp', () => {
    it('should successfully set validate OTP step', async () => {
      const sessionId = 'test-session-id';
      const otp = '123456';
      const mockResponse: OnboardingStatusResponseDto = {
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'SUCCESS',
        onbType: 'CNB',
        sessionId: 'test-session-id',
        securitySeed: 'test-seed',
        identityId: 'test-id',
        publicKey: 'test-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const axiosResponse: AxiosResponse<OnboardingStatusResponseDto> = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.patch.mockReturnValue(of(axiosResponse));
      const result = await firstValueFrom(
        service.setStepValidateOtp(sessionId, otp),
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getOnboardingState', () => {
    it('should return onboarding state', (done) => {
      const sessionId = 'test-session-id';
      const mockResponse: AxiosResponse<GetStateOnboardingResponseDto> = {
        data: {
          id: 1,
          sessionId: 'test-session-id',
          securitySeed: 'seed',
          identityId: 'id',
          onbType: 'type',
          data: {
            startOnbCnb: {
              status: 'status',
              data: {
                ruc: 123,
                message: 'msg',
                cnbClientId: 'client-id',
              },
            },
          },
          status: 'status',
          publicKey: 'key',
          createdAt: new Date(),
          updatedAt: new Date(),
          cnbClientId: 'client-id',
          enabled: true,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get.mockReturnValue(of(mockResponse));

      service
        .getOnboardingState(sessionId)
        .pipe(first())
        .subscribe({
          next: (response) => {
            expect(response).toEqual(mockResponse.data);
            done();
          },
        });
    });
  });

  describe('getClientDataFromStartOnboardingState', () => {
    it('should get client data from start onboarding state', (done) => {
      const sessionId = 'test-session-id';
      const mockClientData: Partial<ClientData> = {
        cnbClientId: 'string',
        email: 'string',
        companyName: 'string',
        ruc: 'string',
        businessAddress: 'string',
        legalRepresentative: 'string',
        establishment: {
          fullAdress: 'string',
          numberEstablishment: 'string',
        },
        username: 'string',
        commerceId: 'string',
        trackingId: 'string',
      };

      const mockResponse = {
        data: {
          identityId: 'string',
          status: 'string',
          data: {
            'start-onb-cnb': {
              data: mockClientData,
            },
          },
        },
      };

      httpService.get.mockReturnValue(of(mockResponse as any));

      service
        .getClientDataFromStartOnboardingState(sessionId)
        .pipe(first())
        .subscribe({
          next: (response) => {
            expect(response.cnbClientId).toEqual(mockClientData.cnbClientId);
            expect(response.identityId).toEqual(mockResponse.data.identityId);
            done();
          },
        });
    });
  });

  describe('getOtpDataFromValidateOtpState', () => {
    it('should return OTP data from validate OTP state', async () => {
      const sessionId = 'test-session-id';
      const mockResponse = {
        data: {
          'validate-otp': {
            data: {
              otp: '123456',
            },
          },
        },
      };

      httpService.get.mockReturnValue(of({ data: mockResponse } as any));
      const result = await firstValueFrom(
        service.getOtpDataFromValidateOtpState(sessionId),
      );

      expect(result).toEqual({ otp: '123456' });
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding successfully', async () => {
      const sessionId = 'test-session-id';
      const mockResponse = { data: 'onboarding completed' };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };
      httpService.patch.mockReturnValue(of(axiosResponse as any));

      const result = await firstValueFrom(service.completeOnboarding(sessionId));

      expect(result).toEqual(mockResponse);
      expect(httpService.patch).toHaveBeenCalledWith(
        `http://localhost:8080/status/${sessionId}`,
        {
          status: 'COMPLETED',
        },
      );
    });
  });

  describe('getCompleteOnboardingStatus', () => {
    it('should return complete onboarding status', async () => {
      const sessionId = 'test-session-id';
      const mockResponse: GetAllOnboardingResponseDto = {
        id: 1,
        sessionId: 'test-session-id',
        securitySeed: 'seed',
        identityId: 'id',
        onbType: 'CNB',
        data: {},
        status: 'COMPLETED',
        publicKey: 'key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      httpService.get.mockReturnValue(of(axiosResponse));

      const result = await firstValueFrom(
        service.getCompleteOnboardingStatus(sessionId),
      );

      expect(result).toEqual(mockResponse);
    });
  });
});
