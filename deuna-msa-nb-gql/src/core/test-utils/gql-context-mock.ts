import { AuthToken } from 'src/core/schema/auth-token.schema';
import { User } from '../schema/user.schema';
import { ClientInfo } from '../schema/merchat-client.schema';

export const createMockContext = (
  overrides?: Partial<{
    req: {
      headers: {
        'auth-token': AuthToken;
        'user-person': User;
        'client-info': ClientInfo;
      };
    };
  }>,
) => {
  const defaults = {
    req: {
      headers: {
        'auth-token': { data: { username: 'testUser' } },
        'user-person': { id: '123', email: 'test@test.com', status: 'ACTIVE' },
      },
    },
  };
  return { ...defaults, ...overrides };
};
