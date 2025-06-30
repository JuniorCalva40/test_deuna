import nock from 'nock';

export function setupUserServiceMock() {
  const baseUrl =
    process.env.AUTH_SERVICE_URL || 'http://deuna-auth.deuna.internal';

  // Mock para obtener información del usuario
  nock(baseUrl)
    .get('/user')
    .query(true) // Esto permite cualquier query string
    .reply(function () {
      // Simular una respuesta exitosa
      return [
        200,
        {
          id: 'mocked-user-id',
          username: 'mockeduser',
          identification: '1234567890',
          email: 'mockeduser@example.com',
          firstName: 'Mocked',
          lastName: 'User',
          status: 'active',
          // ... otros campos relevantes
        },
      ];
    });

  // Mock para obtener usuario por identificación
  nock(baseUrl)
    .get(/\/user\/identification\/.*/)
    .reply(200, {
      id: 'mocked-user-id',
      username: 'mockeduser',
      identification: '1234567890',
      email: 'mockeduser@example.com',
      firstName: 'Mocked',
      lastName: 'User',
      status: 'active',
      // ... otros campos relevantes
    });

  nock(baseUrl)
    .get('/userInfo')
    .reply(function () {
      //   // Verificar si el header de autorización está presente
      //   if (!this.req.headers.authorization) {
      //     return [401, { error: 'Unauthorized' }];
      //   }

      //   // Verificar si el trackingId está presente
      //   if (!this.req.headers.trackingid) {
      //     return [400, { error: 'Missing trackingId' }];
      //   }

      // Simular una respuesta exitosa
      return [
        200,
        {
          username: 'mockeduser',
          'session-id': 'mocked-session-id',
          'identification-number': '1234567890',
          email: 'mockeduser@example.com',
          firstName: 'Mocked',
          lastName: 'User',
        },
      ];
    });

  nock(baseUrl)
    .post('/validate')
    .reply(function () {
      // Verificar si el header de autorización está presente
      const authHeader = this.req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return [401, { error: 'Unauthorized' }];
      }

      // Extraer el token del header de autorización
      const token = authHeader.split(' ')[1];

      // Aquí puedes agregar lógica adicional para validar el token si es necesario
      if (!token) {
        return [401, { error: 'Unauthorized' }];
      }

      // Simular una respuesta exitosa
      return [
        200,
        {
          payload: {
            iss: 'https://your-issuer.com/',
            sub: 'mocked-user-id',
            aud: ['your-audience'],
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600, // Token válido por 1 hora
            azp: 'your-authorized-party',
            scope: 'openid profile email',
            gty: 'password',
            // Puedes agregar más campos según sea necesario
          },
        },
      ];
    });

  nock(baseUrl)
    .post('/microcommerce-auth/validate-token')
    .reply(function () {
      const authorization = 'valid-token';

      // Verificar si el token está presente
      if (!authorization) {
        return [401, { errors: [{ details: 'Unauthorized - Missing token' }] }];
      }

      // Simular validación del token
      if (authorization === 'valid-token') {
        return [
          200,
          {
            userId: 'mocked-user-id',
            username: 'mockeduser',
            email: 'mockeduser@example.com',
            roles: ['USER'],
          },
          {
            'auth-signature': 'mocked-signature',
            'auth-deviceid': 'mocked-device-id',
            'auth-sessionid': 'mocked-session-id',
          },
        ];
      } else {
        return [
          401,
          { errors: [{ details: 'Invalid token' }] },
          {
            'auth-signature': 'mocked-signature',
            'auth-deviceid': 'mocked-device-id',
            'auth-sessionid': 'mocked-session-id',
          },
        ];
      }
    });
}
