import { Observable } from 'rxjs';
import {
  DocumentValidationInputDto,
  FingeprintCodeInputDto,
  InitOnboardingInputDto,
  SetStepAcceptContractInputDto,
  StartOnboardingInputDto,
  UpdateDataOnboardingInputDto,
} from '../dto/msa-co-onboarding-status-input.dto';
import {
  GetStateOnboardingResponseDto,
  InitOnboardingResponseDto,
  ClientData,
  GetAllOnboardingResponseDto,
  OnboardingStatusResponseDto,
} from '../dto/msa-co-onboarding-status-response.dto';

/**
 * Interface for the RestMsaCoOnboardingStatusService.
 */
export interface IMsaCoOnboardingStatusService {
  getOnboardingState(
    sessionId: string,
  ): Observable<GetStateOnboardingResponseDto>;

  updateOnboardingState(
    input: UpdateDataOnboardingInputDto,
    step: string,
  ): Observable<OnboardingStatusResponseDto>;

  initOnboarding(
    input: InitOnboardingInputDto,
  ): Observable<InitOnboardingResponseDto>;

  startOnboarding(
    input: StartOnboardingInputDto,
  ): Observable<OnboardingStatusResponseDto>;

  getClientDataFromStartOnboardingState(
    sessionId: string,
  ): Observable<ClientData>;

  getOtpDataFromValidateOtpState(
    sessionId: string,
  ): Observable<{ otp: string }>;

  setStepAcceptContract(
    data: SetStepAcceptContractInputDto,
  ): Observable<OnboardingStatusResponseDto>;

  setStepValidateOtp(
    sessionId: string,
    otp: string,
  ): Observable<OnboardingStatusResponseDto>;

  setFingerprintStep(
    data: FingeprintCodeInputDto,
  ): Observable<OnboardingStatusResponseDto>;

  setDocumentValidationStep(
    data: DocumentValidationInputDto,
  ): Observable<OnboardingStatusResponseDto>;

  completeOnboarding(sessionId: string): Observable<any>;

  getCompleteOnboardingStatus(
    sessionId: string,
  ): Observable<GetAllOnboardingResponseDto>;
}
