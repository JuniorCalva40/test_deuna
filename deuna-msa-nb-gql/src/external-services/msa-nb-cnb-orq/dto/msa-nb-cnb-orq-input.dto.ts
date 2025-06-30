export class FacialAndLivenessValidationInputDto {
  token1: string;
  token2: string;
  method: number;
}

export class BiometricValidationInputDto {
  facialAndLivenessValidation: FacialAndLivenessValidationInputDto;
  onboardingSessionId: string;
}

export class DocumentValidationInputDto {
  merchantIdScanReference: string;
  frontsideImage: string;
  backsideImage: string;
  country: string;
  idType: string;
  onboardingSessionId: string;
}

export class NotifyOnboardingFinishInputDto {
  commercialName: string;
  establishmentType: string;
  fullAddress: string;
  status: string;
  establishmentNumber: string;
  headquarters: boolean;
  nodeId: string;
  typeClient: string;
  latitude: string;
  longitude: string;
  referenceTransaction: string;
}

export interface IElectronicSignatureDataRequest {
  identificationNumber?: string;
  applicantName?: string;
  applicantLastName?: string;
  fingerCode?: string;
  emailAddress?: string;
  cellphoneNumber?: string;
  city?: string;
  province?: string;
  address?: string;
  fileIdentificationFront?: string;
  fileIdentificationBack?: string;
  fileIdentificationSelfie?: string;
  companyRuc?: string;
}

export class LivenessValidationDetailsInputDto {
  imageBuffer: string;
}

export class CombinedBiometricValidationInputDto {
  facialValidation: FacialAndLivenessValidationInputDto;
  livenessValidation: LivenessValidationDetailsInputDto;
  onboardingSessionId: string;
}

export class BlackListValidationRequest {
  identification: string;
  status?: string;
  isBlacklisted?: boolean;
}
export class BlackListValidationResponse {
  identification: string;
  status?: string;
}

export class GenerateDocumentDto {
  commerceId: string;
  htmlTemplate: string;
  description: string;
  identification: string;
  fileName: string;
  processName: string;
  mimeType: string;
  extension: string;
  tags: string[];
}

export class QueryDocumentInputDto {
  templateName: string;
  templatePath: string;
}