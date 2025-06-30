# Guía de Desarrollo

## Índice

1. [Introducción](#introducción)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Estándares de Codificación](#estándares-de-codificación)
5. [GraphQL y NestJS](#graphql-y-nestjs)
6. [Manejo de Errores](#manejo-de-errores)
7. [Pruebas](#pruebas)
8. [Servicios Externos](#servicios-externos)
9. [Seguridad](#seguridad)
10. [Despliegue](#despliegue)
11. [Mejores Prácticas](#mejores-prácticas)

## Introducción

Esta guía de desarrollo está diseñada para ayudar a los desarrolladores a comprender y contribuir eficazmente al proyecto de onboarding de CNB. Contiene información crucial sobre la estructura del proyecto, estándares de codificación, y mejores prácticas.

## Estructura del Proyecto

El proyecto sigue una estructura modular basada en NestJS:

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── constants/
│   └── mocks/
├── config/
├── controllers/
├── core/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   └── schema/
├── external-services/
│   ├── msa-co-auth/
│   ├── msa-co-commerce/
│   ├── msa-co-document/
│   ├── msa-co-invoice/
│   ├── msa-co-onboarding-status/
│   ├── msa-nb-bussines-rule/
│   ├── msa-nb-client/
│   ├── msa-nb-configuration/
│   ├── msa-tl-notification-email/
│   └── msa-tl-template-generator/
├── operations/
│   ├── accept-billing/
│   ├── accept-contract/
│   ├── confirm-data/
│   ├── query-document/
│   ├── query-onboarding-status/
│   ├── sign-contract/
│   ├── start-onboarding/
│   └── validate-cnb-state/
└── utils/
```

## Configuración del Entorno

1. Asegúrate de tener Node.js (versión 14 o superior) y npm instalados.
2. Clona el repositorio del proyecto.
3. Ejecuta `npm install` para instalar las dependencias.
4. Copia el archivo `.env.example` a `.env` y configura las variables de entorno necesarias.
5. Ejecuta `npm run start:dev` para iniciar el servidor de desarrollo.

## Estándares de Codificación

1. Utiliza TypeScript para todo el código.
2. Sigue las guías de estilo de ESLint y Prettier configuradas en el proyecto.
3. Utiliza nombres descriptivos para variables, funciones y clases.
4. Escribe comentarios para explicar la lógica compleja o no obvia.
5. Mantén las funciones pequeñas y enfocadas en una sola responsabilidad.

## GraphQL y NestJS

1. Define los tipos GraphQL en archivos `.graphql` o utilizando decoradores de TypeScript.
2. Utiliza los decoradores `@Resolver()`, `@Query()`, y `@Mutation()` para definir resolvers.
3. Implementa DTOs (Data Transfer Objects) para la entrada y salida de datos.
4. Utiliza el decorador `@Args()` para los argumentos de las queries y mutaciones.

Ejemplo de un resolver:

```typescript
@Resolver()
export class StartOnboardingResolver {
  constructor(private readonly startOnboardingService: StartOnboardingService) {}

  @Mutation(() => StartOnboardingResponse)
  async startOnboarding(
    @Args('input') input: StartOnboardingInput
  ): Promise<StartOnboardingResponse> {
    return this.startOnboardingService.startOnboarding(input);
  }
}
```

## Manejo de Errores

1. Utiliza el `ErrorHandler` personalizado para manejar errores de forma consistente.
2. Lanza errores específicos de GraphQL (como `ApolloError`) cuando sea apropiado.
3. Asegúrate de que todos los errores sean registrados adecuadamente.

Ejemplo de manejo de errores:

```typescript
try {
  // Lógica que puede lanzar un error
} catch (error) {
  return ErrorHandler.handleError(error, 'start-onboarding');
}
```

## Pruebas

1. Escribe pruebas unitarias para todos los servicios y resolvers.
2. Utiliza Jest como framework de pruebas.
3. Apunta a una cobertura de código de al menos 90%.
4. Utiliza mocks para simular servicios externos y dependencias.

Ejemplo de una prueba:

```typescript
describe('StartOnboardingService', () => {
  let service: StartOnboardingService;
  let mockMsaCoCommerceService: jest.Mocked<IMsaCoCommerceService>;

  beforeEach(async () => {
    // Configuración de la prueba
  });

  it('should successfully start onboarding process', async () => {
    // Implementación de la prueba
  });
});
```

## Servicios Externos

1. Implementa interfaces para todos los servicios externos.
2. Utiliza el patrón de inyección de dependencias para los servicios externos.
3. Crea versiones simuladas (mocks) de los servicios externos para pruebas.

Ejemplo de definición de servicio externo:

```typescript
@Injectable()
export class RestMsaCoCommerceService implements IMsaCoCommerceService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {}

  // Implementación de métodos
}
```

## Seguridad

1. Utiliza guardias para proteger las rutas y operaciones GraphQL.
2. Implementa autenticación basada en tokens JWT.
3. Valida y sanea todas las entradas de usuario.
4. Utiliza HTTPS en producción.

Ejemplo de un guardia:

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Implementación de la lógica de autenticación
  }
}
```

## Despliegue

1. Utiliza Docker para contenerizar la aplicación.
2. Configura un pipeline de CI/CD para automatizar las pruebas y el despliegue.
3. Utiliza variables de entorno para la configuración específica del entorno.

## Mejores Prácticas

1. Sigue los principios SOLID en el diseño de tu código.
2. Utiliza programación asincrónica (async/await) para operaciones que puedan bloquearse.
3. Implementa registro (logging) detallado para facilitar la depuración y el monitoreo.
4. Utiliza transacciones para operaciones que involucren múltiples pasos o servicios.
5. Implementa validación de datos de entrada utilizando class-validator.
6. Utiliza el patrón de repositorio para el acceso a datos cuando sea aplicable.
7. Mantén las dependencias actualizadas regularmente.
8. Documenta las APIs y los cambios importantes en el código.

Recuerda que esta guía es un documento vivo. A medida que el proyecto evoluciona, asegúrate de mantener esta guía actualizada con las mejores prácticas y estándares más recientes.