export class BiometricValidationResponseDto {
  scanId: string;
}

export class DocumentValidationResponseDto {
  statusValidation: string;
}

export class ElectronicSignatureProcessResponseDto {
  status: string;
  message: string;
  referenceTransaction: string;
}

export class ISaveElectronicSignatureResponseRedis {
  status: string;
  message: string;
}

export class GenerateDocumentResponseDto {
  status: string;
  message: string;
  data: {
    signedUrl: string;
    fileName: string;
    processName: string;
    tags: string[];
  }[];
}

export class QueryDocumentResponseDto {
  status: string;
  message: string;
  data: {
    presignedUrl: string;
    b64encoded: string;
  };
}