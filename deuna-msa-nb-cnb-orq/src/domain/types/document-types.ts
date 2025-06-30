export interface FileGeneratorMetadata {
  documentNumber: string;
  detailAttached: string;
  commerceId: string;
}

export interface FileGeneratorResponse {
  b64encoded: string;
  presignedUrl: string;
  message: string;
}

export interface FileManagerMetadata {
  commerceId: string;
  [key: string]: any;
}

export interface FileManagerRequest {
  origin: string;
  processName: string;
  fileName: string;
  mimeType: string;
  tags: string[];
  description: string;
  identificationId: string;
  referenceId: string;
  extension: string;
  trackingId: string;
  metadata: FileManagerMetadata;
}

export interface FileManagerResponse {
  signedUrl: string;
}

export interface GenerateDocumentResult {
  signedUrl: string;
  base64: string;
  fileName: string;
  processName: string;
  tags: string[];
  mimeType: string;
  extension: string;
  trackingId: string;
}
