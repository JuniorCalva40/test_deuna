# deuna-msa-ng-gql

Este microservicio funciona de BFF (Backend for Frontend) de los componentes del producto de CNBs.
Contiene los siguientes servicios para la App de Comercios:
- Onboarding para nuevos usuarios, incluyendo estado del proces de onboarding, firma de contratos, confirmación de datos, aceptación de facturación y consulta de estado.
- Depositos
- Retiros

## Tabla de Contenidos

- [Estructura del Proyecto](#estructura-del-proyecto)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Configuración del Proyecto](#configuración-del-proyecto)
- [Pruebas Unitarias](#pruebas-unitarias)
  - [Pruebas de Servicios](#pruebas-de-servicios)
  - [Pruebas de Resolvers GraphQL](#pruebas-de-resolvers-graphql)
  - [Pruebas de Providers](#pruebas-de-providers)
- [Ejecutar las Pruebas](#ejecutar-las-pruebas)
- [Cobertura de Código](#cobertura-de-código)
- [Contribuir](#contribuir)
- [CI/CD](#cicd)
- [Documentación Adicional](#documentación-adicional)

## Estructura del Proyecto

El proyecto está organizado en los siguientes directorios principales:

- `src/operations/`: Contiene los servicios principales del proceso de onboarding.
- `src/external-services/`: Servicios externos utilizados en el proceso de onboarding.
- `src/utils/`: Utilidades comunes, incluyendo el manejo de errores.

## Tecnologías Utilizadas

- Node.js
- NestJS
- GraphQL
- Jest (para pruebas unitarias)
- TypeScript

## Configuración del Proyecto

1. Clone el repositorio:
   ```
   git clone https://dev.azure.com/Deuna/prd-cnb/_git/deuna-msa-nb-gql
   ```

2. Instale las dependencias:
   ```
   npm install
   ```

3. Configure las variables de entorno:
   ```
   cp .env.example .env
   ```
   Edite el archivo `.env` con los valores apropiados para su entorno.

4. Inicie el servidor de desarrollo:
   ```
   npm run start:dev
   ```

## Variables de Entorno

| Nombre de la Variable                      | Valor por Defecto         | Valores Posibles          | Descripción                                                                 |
|--------------------------------------------|---------------------------|---------------------------|-----------------------------------------------------------------------------|
| ENVIRONMENT_VARIABLE                       | VALUE                     | VALUE                     | Variable de entorno genérica.                                               |
| PORT                                       | 4001                      | Número de puerto          | Puerto en el que se ejecuta el servidor.                                    |
| NODE_ENV                                   | 'local'                   | 'local', 'development', 'production' | Entorno de ejecución de Node.js.                                            |
| AUTH_SERVICE_URL                           | 'http://localhost:4000'   | URL                       | URL del servicio de autenticación.                                          |
| USER_SERVICE_TYPE                          | 'rest'                    | 'rest', 'graphql'         | Tipo de protocolo de comunicacion con el servicio user.                                          |
| USER_SERVICE_URL                           | 'http://localhost:4000'   | URL                       | URL del servicio de usuarios.                                               |
| PRODUCT_SERVICE_TYPE                       | 'rest'                    | 'rest', 'graphql'         | Tipo de protocolo de comunicacion con el servicio product.                                          |
| PRODUCT_SERVICE_URL                        | 'http://localhost:4000'   | URL                       | URL del servicio de product.                                               |
| ANONYMOUS_AUTH_SERVICE_URL                 | 'http://localhost:4000'   | URL                       | URL del servicio de autenticación anónima.                                  |
| MSA_CO_ONBOARDING_STATUS_SERVICE_TYPE      | 'rest'                    | 'rest', 'graphql'         | Tipo de servicio para el estado de onboarding.                              |
| MSA_CO_ONBOARDING_STATUS_URL               | 'http://localhost:8080'   | URL                       | URL del servicio de estado de onboarding.                                   |
| MSA_NB_CONFIGURATION_SERVICE_TYPE          | 'rest'                    | 'rest', 'graphql'         | Tipo de servicio para la configuración del cliente CNB.                     |
| MSA_NB_CONFIGURATION_URL                   | 'http://localhost:8080'   | URL                       | URL del servicio de configuración del cliente CNB.                          |
| MSA_CO_AUTH_SERVICE_TYPE                   | 'rest'                    | 'rest', 'graphql'         | Tipo de servicio de autenticación.                                          |
| MSA_CO_AUTH_URL                            | 'http://localhost:8080'   | URL                       | URL del servicio de autenticación.                                          |
| MSA_CO_INVOICE_SERVICE_TYPE                | 'mock'                    | 'mock', 'rest', 'graphql' | Tipo de servicio de facturación.                                            |
| MSA_CO_INVOICE_API_URL                     | 'http://localhost:8081'   | URL                       | URL del servicio de facturación.                                            |
| MSA_NB_CLIENT_SERVICE_TYPE                 | 'rest'                    | 'rest', 'graphql'         | Tipo de servicio del cliente CNB.                                           |
| MSA_NB_CLIENT_SERVICE_URL                  | 'http://localhost:8080'   | URL                       | URL del servicio del cliente CNB.                                           |
| MSA_CO_COMMERCE_SERVICE_TYPE               | 'rest'                    | 'rest', 'graphql'         | Tipo de servicio de información de comercios.                               |
| MSA_CO_COMMERCE_SERVICE_URL                | 'http://localhost:8080'   | URL                       | URL del servicio de información de comercios.                               |
| BUSSINES_RULE_SERVICE_TYPE                 | 'rest'                    | 'rest', 'graphql'         | Tipo de servicio de reglas de negocio.                                      |
| MSA_TL_NOTIFICATION_EMAIL_SERVICE_TYPE     | 'rest'                    | 'rest', 'graphql'         | Tipo de servicio de notificación por correo electrónico.                    |
| MSA_TL_TEMPLATE_GENERATOR_SERVICE_TYPE     | 'rest'                    | 'rest', 'graphql'         | Tipo de servicio de generación de plantillas.                               |
| MSA_TL_TEMPLATE_GENERATOR_URL              | 'http://localhost:8080'   | URL                       | URL del servicio de generación de plantillas.                               |
| MSA_CO_DOCUMENT_SERVICE_TYPE               | 'rest'                    | 'rest', 'graphql'         | Tipo de servicio de generación de documentos.                               |
| MSA_CO_DOCUMENT_URL                        | 'http://localhost:8080'   | URL                       | URL del servicio de generación de documentos.                               |
| KAFKA_URLS                                 | 'localhost:9091'          | URL                       | URLs del servidor Kafka.                                                    |
| KAFKA_SSL_ENABLED                          | 'false'                   | 'true', 'false'           | Habilitar SSL para Kafka.                                                   |
| SASL_USERNAME                              |                           | String                    | Nombre de usuario para SASL en Kafka.                                       |
| SASL_PASSWORD                              |                           | String                    | Contraseña para SASL en Kafka.                                              |
| HTTP_CLIENT_RETRY                          | 3                         | Número                    | Número de reintentos para el cliente HTTP.                                  |
| HTTP_CLIENT_TIMEOUT                        | 30000                     | Número (milisegundos)     | Tiempo de espera para el cliente HTTP.                                      |

## Pruebas Unitarias

Hemos implementado pruebas unitarias exhaustivas para los componentes críticos del sistema. Esto incluye:

### Pruebas de Servicios

Archivos de prueba para los siguientes servicios:

1. StartOnboardingService
2. SignContractService
3. ConfirmDataService
4. AcceptBillingService
5. QueryOnboardingStatusService
6. RestMsaCoOnboardingStatusService
7. RestMsaCoAuthService
8. RestMsaCoDocumentService
9. ErrorHandler
10. ClientsService (validate-cnb-state)

### Pruebas de Resolvers GraphQL

Archivos de prueba para los siguientes Resolvers:

1. StartOnboardingResolver
2. SignContractResolver
3. ConfirmDataResolver
4. AcceptBillingResolver
5. QueryOnboardingStatusResolver
6. ValidateCnbStateResolver

### Pruebas de Providers

Archivos de prueba para los siguientes Providers:

1. msaCoAuthServiceProvider
2. msaCoCommerceServiceProvider
3. msaCoDocumentServiceProvider
4. msaCoInvoiceServiceProvider
5. msaNbClientServiceProvider
6. msaNbConfigurationServiceProvider
7. msaNbOnboardingStatusServiceProvider
8. msaTlNotificationEmailServiceProvider
9. msaTlTemplateGeneratorServiceProvider
10. bussinesRuleServiceProvider

## Ejecutar las Pruebas

Para ejecutar todas las pruebas unitarias, use el siguiente comando:

```
npm run test
```

Para ejecutar las pruebas con cobertura:

```
npm run test:cov
```

Para ejecutar las pruebas en modo watch:

```
npm run test:watch
```

## Cobertura de Código

Nos esforzamos por mantener una cobertura de código de al menos 90% para todos los servicios críticos y Resolvers GraphQL. Puedes ver el informe de cobertura después de ejecutar las pruebas con cobertura.

Para ver un informe detallado de la cobertura, abra el archivo `coverage/lcov-report/index.html` en su navegador después de ejecutar las pruebas con cobertura.

## Contribuir

1. Cree una nueva rama para su feature o bugfix:
   ```
   git checkout -b feature/nombre-de-la-feature
   ```
   o
   ```
   git checkout -b bugfix/nombre-del-bug
   ```

2. Asegúrese de que todas las nuevas características o cambios estén cubiertos por pruebas unitarias.

3. Mantenga la cobertura de código por encima del 90%.

4. Siga las convenciones de nomenclatura existentes para los archivos de prueba:
   - Para servicios: `[nombre-del-servicio].service.spec.ts`
   - Para Resolvers: `[nombre-del-resolver].resolver.spec.ts`
   - Para Providers: `[nombre-del-provider].provider.spec.ts`

5. Utilice mocks para simular dependencias externas en las pruebas.

6. Asegúrese de que su código siga las guías de estilo del proyecto (use `npm run lint` para verificar).

7. Haga commit de sus cambios siguiendo las convenciones de Conventional Commits:
   ```
   git commit -m "feat: agregar nueva funcionalidad X"
   ```

8. Haga push de su rama y cree un Pull Request.

## CI/CD

Todas las pruebas se ejecutan automáticamente en nuestro pipeline de CI/CD. Asegúrese de que todas las pruebas pasen antes de fusionar cambios en la rama principal.

El pipeline incluye los siguientes pasos:

1. Instalación de dependencias
2. Linting
3. Ejecución de pruebas unitarias
4. Generación de informe de cobertura
5. Construcción del proyecto

## Documentación Adicional

Para más información sobre el proyecto y sus componentes, consulte los siguientes recursos:

- [Error manejando dependencias](./docs/issues_dependencies.md)
- [Documentación de la API GraphQL](./docs/graphql-api.md)
- [Guía de Desarrollo](./docs/development-guide.md)

Si tiene alguna pregunta o problema, no dude en abrir un issue en el repositorio o contactar al equipo de desarrollo.
