export class AuthToken {
  sessionId: string;
  deviceId: string;
  signature: string;
  tokenType: string;
  role: string;
  data: {
    username: string;
    personInfo: {
      identification: string;
    };
  };
}
