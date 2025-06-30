import { Observable } from 'rxjs';
import {
  BiometricValidationInputDto,
  DocumentValidationInputDto,
  NotifyOnboardingFinishInputDto,
  IElectronicSignatureDataRequest,
  BlackListValidationRequest,
  BlackListValidationResponse,
  GenerateDocumentDto,
  QueryDocumentInputDto,
} from '../dto/msa-nb-cnb-orq-input.dto';
import {
  BiometricValidationResponseDto,
  DocumentValidationResponseDto,
  ElectronicSignatureProcessResponseDto,
  ISaveElectronicSignatureResponseRedis,
  GenerateDocumentResponseDto,
  QueryDocumentResponseDto,
} from '../dto/msa-nb-cnb-orq-response.dto';
import { TrackingBaseDto } from '../../../common/constants/common';

export interface IMsaNbCnbOrqService {
  startBiometricValidation(
    input: BiometricValidationInputDto,
    tracking: TrackingBaseDto,
  ): Observable<BiometricValidationResponseDto>;

  documentValidation(
    input: DocumentValidationInputDto,
    tracking: TrackingBaseDto,
  ): Observable<DocumentValidationResponseDto>;

  notifyOnboardingFinish(
    input: NotifyOnboardingFinishInputDto,
    tracking: TrackingBaseDto,
  ): Observable<void>;

  startElectronicSignatureProcess(
    clientCnbDocumentId: string,
    tracking: TrackingBaseDto,
  ): Observable<ElectronicSignatureProcessResponseDto>;

  createElectronicSign(
    data: IElectronicSignatureDataRequest,
    tracking: TrackingBaseDto,
  ): Promise<ISaveElectronicSignatureResponseRedis>;

  updateElectronicSign(
    data: IElectronicSignatureDataRequest,
    tracking: TrackingBaseDto,
  ): Promise<ISaveElectronicSignatureResponseRedis>;

  saveCnbState(
    data: BlackListValidationRequest,
    tracking: TrackingBaseDto,
  ): Observable<BlackListValidationResponse>;

  getCnbState(
    identification: string,
    tracking: TrackingBaseDto,
  ): Observable<BlackListValidationRequest | BlackListValidationResponse>;

  generateDocument(
    document: GenerateDocumentDto,
  ): Observable<GenerateDocumentResponseDto>;

  queryDocument(
    input: QueryDocumentInputDto,
  ): Observable<QueryDocumentResponseDto>;
}

export const MSA_NB_CNB_ORQ_SERVICE = 'MSA_NB_CNB_ORQ_SERVICE';
