import { get, isEmpty, set } from 'lodash';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

interface ICustomHeaders {
  'x-session-id'?: string;
  'x-public-ip'?: string;
  'x-device-id'?: string;
  'x-latitude'?: string;
  'x-longitude'?: string;
  'x-app-version'?: string;
  'x-username'?: string;
  'x-identification-number'?: string;
}

/**
 * Builds the headers for a request.
 *
 * @param {object} headerInput - The input headers.
 * @returns {object} - The built headers.
 */
export const headersBuild = (headerInput: ICustomHeaders): object => {
  headerInput['x-device-id'] =
    headerInput['x-device-id'] || headerInput['x-context'];
  const headers = JSON.stringify(headerInput, [
    'x-session-id',
    'x-public-ip',
    'x-device-id',
    'x-latitude',
    'x-longitude',
    'x-app-version',
    'x-username',
    'x-identification-number',
  ]);

  const commonHeaders = JSON.parse(headers);
  const ip = get(commonHeaders, 'x-public-ip', null);

  if (isEmpty(ip)) set(commonHeaders, 'x-public-ip', '0.0.0.0');

  return commonHeaders;
};

/**
 * Decodes a token and returns the decoded information.
 * @param token - The token to decode.
 * @returns The decoded token information.
 * @throws Error if the token is invalid.
 */
export function decodeToken(token: string, configService?: ConfigService): any {
  try {
    const namespace = configService?.get<string>('AUTH0_NAMESPACE');

    const decoded = jwt.decode(token) as any;
    decoded.tokenType = decoded?.tokenType
      ? decoded.tokenType
      : decoded[namespace + '/tokenType'];
    decoded.sessionId = decoded?.sessionId
      ? decoded.sessionId
      : decoded[namespace + '/sessionId'];
    decoded.roles = decoded?.roles
      ? decoded.roles
      : decoded[namespace + '/roles'];
    return decoded;
  } catch (err) {
    throw new Error('Invalid token');
  }
}
