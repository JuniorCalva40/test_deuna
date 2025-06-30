import { Observable } from 'rxjs';
import {
  InitOnboardingInputDto,
  SetStepAcceptContractInputDto,
  StartOnboardingInputDto,
  UpdateDataOnboardingInputDto,
} from '../dto/msa-co-onboarding-status-input.dto';
import {
  ConfirmDataResponseDto,
  GetStateOnboardingResponseDto,
  InitOnboardingResponseDto,
  SetStepValidateOtpResponseDto,
  StartOnboardingResponseDto,
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
  ): Observable<ConfirmDataResponseDto>;

  initOnboarding(
    input: InitOnboardingInputDto,
  ): Observable<InitOnboardingResponseDto>;

  startOnboarding(
    input: StartOnboardingInputDto,
  ): Observable<StartOnboardingResponseDto>;

  getClientDataFromStartOnboardingState(sessionId: string): Observable<{
    cnbClientId: string;
    email: string;
    companyName: string;
    ruc: string;
    businessAddress: string;
    legalRepresentative: string;
    identityId: string;
    establishment: {
      fullAdress: string;
      numberEstablishment: string;
    };
  }>;

  getOtpDataFromValidateOtpState(
    sessionId: string,
  ): Observable<{ otp: string }>;

  setStepAcceptContract(
    data: SetStepAcceptContractInputDto,
  ): Observable<ConfirmDataResponseDto>;

  setStepValidateOtp(
    sessionId: string,
    otp: string,
  ): Observable<SetStepValidateOtpResponseDto>;

  completeOnboarding(sessionId: string): Observable<any>;
}
