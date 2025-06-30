export class AuthToken {
  sessionId: string;
  deviceId: string;
  signature: string;
  tokenType: string;
  role: string;
  data: {
    ip: string,
    username: string;
    personInfo: {
      identification?: string;
    };
  };
}
