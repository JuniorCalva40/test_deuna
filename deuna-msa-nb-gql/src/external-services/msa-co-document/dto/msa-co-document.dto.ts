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

export class QueryDocumentInputDto {
  templateName: string;
  templatePath: string;
}

export class QueryDocumentResponseDto {
  status: string;
  message: string;
  data: {
    presignedUrl: string;
    b64encoded: string;
  };
}
