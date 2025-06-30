export class BlackListResponseDTO {
  screening_passed: boolean;
  result: BlackListResult[];
}

export interface BlackListResult {
  blackListType: string;
  isUserOnBlackList: boolean;
  error?: string;
}
