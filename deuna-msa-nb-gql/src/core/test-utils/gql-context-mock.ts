import { AuthToken } from 'src/core/schema/auth-token.schema';
import { User } from '../schema/user.schema';

export const createMockContext = (
  overrides?: Partial<{
    req: { headers: { 'auth-token': AuthToken; 'user-person': User } };
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
