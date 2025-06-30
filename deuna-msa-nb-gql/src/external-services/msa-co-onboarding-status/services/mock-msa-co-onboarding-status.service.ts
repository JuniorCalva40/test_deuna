import { Injectable } from '@nestjs/common';
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
import { IMsaCoOnboardingStatusService } from '../interfaces/msa-co-onboarding-status-service.interface';

@Injectable()
export class FakeMsaCoOnboardingStatusService
  implements IMsaCoOnboardingStatusService
{
  getOtpDataFromValidateOtpState(
    sessionId: string,
  ): Observable<{ otp: string }> {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    return new Observable((subscriber) => {
      subscriber.next({ otp: '123456' });
      subscriber.complete();
    });
  }
  setStepValidateOtp(
    sessionId: string,
    otp: string,
  ): Observable<SetStepValidateOtpResponseDto> {
    if (!sessionId || !otp) {
      throw new Error('sessionId and otp are required');
    }
    return new Observable((subscriber) => {
      subscriber.next({
        status: 'SUCCESS',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        onbType: '',
      });
      subscriber.complete();
    });
  }
  completeOnboarding(sessionId: string): Observable<any> {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    return new Observable((subscriber) => {
      subscriber.next({ status: 'SUCCESS' });
      subscriber.complete();
    });
  }
  setStepAcceptContract(
    data: SetStepAcceptContractInputDto,
  ): Observable<ConfirmDataResponseDto> {
    if (!data.sessionId) {
      throw new Error('sessionId is required');
    }

    throw new Error('Method not implemented.');
  }
  startOnboarding(
    input: StartOnboardingInputDto,
  ): Observable<StartOnboardingResponseDto> {
    console.log('startOnboarding', input);
    throw new Error('Method not implemented.');
  }
  initOnboarding(
    input: InitOnboardingInputDto,
  ): Observable<InitOnboardingResponseDto> {
    console.log('initOnboarding', input);
    throw new Error('Method not implemented.');
  }
  getClientDataFromStartOnboardingState(): Observable<{
    cnbClientId: string;
    email: string;
    companyName: string;
    ruc: string;
    businessAddress: string;
    legalRepresentative: string;
    identityId: string;
    establishment: { fullAdress: string; numberEstablishment: string };
  }> {
    throw new Error('Method not implemented.');
  }

  getOnboardingState(
    sessionId: string,
  ): Observable<GetStateOnboardingResponseDto> {
    // validate input data session id
    if (!sessionId) {
      throw new Error('sessionId is required');
    }
    // simulate successful response
    const response: GetStateOnboardingResponseDto = {
      id: 8,
      sessionId: '597c42af-6516-48b8-9eee-9c2de3b3e549',
      securitySeed: '5fd924625f6ab16a1',
      identityId: '1728839940',
      onbType: 'cnb',
      data: {
        startOnbCnb: {
          status: 'SUCCESS',
          data: {
            ruc: 172553440001,
            message: 'Ruc Validado exitosamente',
            cnbClientId: 'e6c476da-90ec-4554-af64-24e31dd60697',
          },
        },
      },
      status: 'IN_PROGRESS',
      publicKey:
        '5fd924625f6ab16a19cc9807c7c506ae1813490e4ba675f843d5a10e0baacdb8',
      createdAt: new Date('2024-09-02T21:41:25.927Z'),
      updatedAt: new Date('2024-09-02T21:41:25.927Z'),
    };
    return new Observable((subscriber) => {
      subscriber.next(response);
      subscriber.complete();

      return {
        unsubscribe() {},
      };
    });
  }

  updateOnboardingState(
    input: UpdateDataOnboardingInputDto,
  ): Observable<ConfirmDataResponseDto> {
    // validate input
    if (!input) {
      throw new Error('input data is required');
    }
    // simulate successful response
    const response: ConfirmDataResponseDto = {
      successSteps: ['start-onb-cnb', 'confirm-data'],
      requiredSteps: ['accept-billing', 'accept-contract', 'sign-contract'],
      optionalSteps: [''],
      failureSteps: [],
      successIdentityValidationSteps: [],
      standbyIdentityValidationSteps: [''],
      processingFailure: [],
      status: 'IN_PROGRESS',
      onbType: 'cnb',
    };
    return new Observable((subscriber) => {
      subscriber.next(response);
      subscriber.complete();

      return {
        unsubscribe() {},
      };
    });
  }
}
