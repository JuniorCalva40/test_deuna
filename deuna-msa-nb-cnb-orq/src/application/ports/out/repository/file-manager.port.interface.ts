export const FILE_MANAGER_PORT = 'FileManagerPort' as const;

export interface FileManagerPort {
  storeFile(fileData: any, metadata: any): Promise<any>;
}
