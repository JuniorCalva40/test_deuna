export const FILE_GENERATOR_PORT = 'FileGeneratorPort' as const;

export interface FileGeneratorPort {
  generateFile(
    content: string,
    fileName: string,
    trackingId: string,
    mimeType: string,
    extension: string,
    processName: string,
    metadata: object,
  ): Promise<{
    b64encoded: string;
    presignedUrl: string;
  }>;
}
