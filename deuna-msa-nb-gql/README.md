# deuna-msa-nb-gql

Este microservicio funciona de BFF (Backend for Frontend) de los componentes del producto de CNBs.
Contiene los siguientes servicios para la App de Comercios:
- Onboarding para nuevos usuarios: 
  - Proceso de onboarding
  - Firma de contratos
  - Confirmación de datos
  - Aceptacion de facturacion Electronica.
- Depositos
  - Deposito a cuenta
  - Deposito con codigo QR
- Retiros

## Contenido

- [Estructura del microservicio](#estructura-del-microservicio)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Configuracion del microservicio](#configuracion-del-microservicio)
  - [Variables de Entorno](#variables-de-entorno)
  - [Ejemplo de variables con proxy](#ejemplo-de-variables-con-proxy)
- [Ejecucion del microservicio](#ejecucion-del-microservicio)
  - [Usando contenedores](#usando-contenedores)
  - [Usando Nodejs standalone](#usando-nodejs-standalone)
- [Ejecucion de pruebas unitarias](#ejecucion-de-pruebas-unitarias)
- [Cobertura de Código](#cobertura-de-código)
- [Contribuir](#contribuir)
- [Documentación Adicional](#documentación-adicional)

## Estructura del microservicio

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

## Configuracion del microservicio

### Variables de Entorno

| Nombre de la Variable                  | Valor por Defecto       | Valores Posibles                     | Descripción                                                   |
|----------------------------------------|-------------------------|--------------------------------------|---------------------------------------------------------------|
| NODE_ENV                               | 'development'           | 'local', 'development', 'production' | Entorno de ejecución de Node.js.                              |
| AUTH_SERVICE_URL                       | 'http://localhost:4000' | URL                                  | URL del servicio de autenticación.                            |
| ANONYMOUS_AUTH_SERVICE_URL             | 'http://localhost:4000' | URL                                  | URL del servicio de autenticación anónima.                    |
| CLOUD_SERVICE_PROVIDER                 | 'aws'                   | 'none' o 'aws'                       | Identificacion del tipo de proveedor cloud que se esta usando |
| HTTP_CLIENT_RETRY                      | 3                       | Número                               | Número de reintentos para el cliente HTTP.                    |
| HTTP_CLIENT_TIMEOUT                    | 30000                   | Número (milisegundos)                | Tiempo de espera para el cliente HTTP.                        |
| MSA_MC_BO_CLIENT_SERVICE_URL           | 'http://localhost:8080' | URL                                  | URL del servicio de backoffice client service                 |
| MSA_CO_AUTH_SERVICE_TYPE               | 'rest'                  | 'rest', 'graphql'                    | Tipo de servicio de autenticación.                            |
| MSA_CO_AUTH_URL                        | 'http://localhost:8080' | URL                                  | URL del servicio de autenticación.                            |
| MSA_CO_CALIFICATION_SERVICE_TYPE       | 'http://localhost:8080' | URL                                  | Tipo de servicio de reglas de negocio.                        |
| MSA_CO_CALIFICATION_URL                | 'http://localhost:8080' | URL                                  | URL del servicio de creacion de calificacion.                 |
| MSA_CO_COMMERCE_SERVICE_TYPE           | 'rest'                  | 'rest', 'graphql'                    | Tipo de servicio de información de comercios.                 |
| MSA_CO_COMMERCE_SERVICE_URL            | 'http://localhost:8080' | URL                                  | URL del servicio de información de comercios.                 |
| MSA_CO_DOCUMENT_SERVICE_TYPE           | 'rest'                  | 'rest', 'graphql'                    | Tipo de servicio de generación de documentos.                 |
| MSA_CO_DOCUMENT_URL                    | 'http://localhost:8080' | URL                                  | URL del servicio de generación de documentos.                 |
| MSA_CO_INVOICE_SERVICE_TYPE            | 'mock'                  | 'mock', 'rest', 'graphql'            | Tipo de servicio de facturación.                              |
| MSA_CO_INVOICE_API_URL                 | 'http://localhost:8081' | URL                                  | URL del servicio de facturación.                              |
| MSA_CO_ONBOARDING_STATUS_SERVICE_TYPE  | 'rest'                  | 'rest', 'graphql'                    | Tipo de servicio para el estado de onboarding.                |
| MSA_CO_ONBOARDING_STATUS_URL           | 'http://localhost:8080' | URL                                  | URL del servicio de estado de onboarding.                     |
| BUSSINES_RULE_SERVICE_TYPE             | 'rest'                  | 'rest', 'graphql'                    | Tipo de servicio de reglas de negocio.                        |
| MSA_NB_CONFIGURATION_SERVICE_TYPE      | 'rest'                  | 'rest', 'graphql'                    | Tipo de servicio para la configuración del cliente CNB.       |
| MSA_NB_CONFIGURATION_URL               | 'http://localhost:8080' | URL                                  | URL del servicio de configuración del cliente CNB.            |
| MSA_NB_CLIENT_SERVICE_TYPE             | 'rest'                  | 'rest', 'graphql'                    | Tipo de servicio del cliente CNB.                             |
| MSA_NB_CLIENT_SERVICE_URL              | 'http://localhost:8080' | URL                                  | URL del servicio del cliente CNB.                             |
| MSA_TL_NOTIFICATION_EMAIL_SERVICE_TYPE | 'rest'                  | 'rest', 'graphql'                    | Tipo de servicio de notificación por correo electrónico.      |
| MSA_TL_OTP_SERVICE_URL                 | 'http://localhost:8080' | URL                                  | URL del servicio de OTP                                       |
| MSA_TL_TEMPLATE_GENERATOR_SERVICE_TYPE | 'rest'                  | 'rest', 'graphql'                    | Tipo de servicio de generación de plantillas.                 |
| MSA_TL_TEMPLATE_GENERATOR_URL          | 'http://localhost:8080' | URL                                  | URL del servicio de generación de plantillas.                 |
| KAFKA_GROUP_ID                         | 'nb-gql'                | valor por defecto 'nb-gql'           | Nombre del Grupo especifico para el Producto CNB              |
| KAFKA_URLS                             | 'localhost:9091'        | URL                                  | URLs del servidor Kafka.                                      |
| KAFKA_SSL_ENABLED                      | 'false'                 | 'true', 'false'                      | Habilitar SSL para Kafka.                                     |
| PRODUCT_SERVICE_TYPE                   | 'rest'                  | 'rest', 'graphql'                    | Tipo de protocolo de comunicacion con el servicio product.    |
| PRODUCT_SERVICE_URL                    | 'http://localhost:4000' | URL                                  | URL del servicio de product.                                  |
| SASL_USERNAME                          |                         | String                               | Nombre de usuario para SASL en Kafka.                         |
| SASL_PASSWORD                          |                         | String                               | Contraseña para SASL en Kafka.                                |
| SERVICE_NAME                           | 'msa-nb-gql'            | Nombre del microservicio             | Nombre del microservicio que se muestra en el logger          |
| SERVICE_PORT                           | 80                      | Número de puerto                     | Puerto en el que se ejecuta el servidor.                      |
| USER_SERVICE_TYPE                      | 'rest'                  | 'rest', 'graphql'                    | Tipo de protocolo de comunicacion con el servicio user.       |
| USER_SERVICE_URL                       | 'http://localhost:4000' | URL                                  | URL del servicio de usuarios.                                 |

### Ejemplo de variables con proxy

| Variable                          | Valor                                                                                        |
|-----------------------------------|----------------------------------------------------------------------------------------------|
| MSA_CO_AUTH_URL                   | 'http://localhost:8080/proxy/deuna-msa-co-auth.commerces.svc.cluster.local'                  |
| MSA_CO_CALIFICATION_URL           | 'http://localhost:8080/proxy/deuna-msa-co-calification.svc.cluster.local'                    |
| MSA_CO_COMMERCE_SERVICE_URL       | 'http://localhost:8080/proxy/deuna-msa-co-commerce.commerces.svc.cluster.local'              |
| MSA_CO_DOCUMENT_URL               | 'http://localhost:8080/proxy/deuna-msa-co-document.commerces.svc.cluster.local'              |
| MSA_CO_ONBOARDING_STATUS_URL      | 'http://localhost:8080/proxy/deuna-msa-co-onboarding-status.commerces.svc.cluster.local'     |
| MSA_CO_TRANSFER_ORCHESTRATION_URL | 'http://localhost:8080/proxy/deuna-msa-co-transfer-orchestation.commerces.svc.cluster.local' |
| MSA_NB_CONFIGURATION_URL          | 'http://localhost:8080/proxy/deuna-msa-nb-configuration.cnb.svc.cluster.local'               |
| MSA_NB_CLIENT_SERVICE_URL         | 'http://localhost:8080/proxy/deuna-msa-nb-client.cnb.svc.cluster.local/api/v1'               |
| MSA_NB_ORQ_TRANSACTION_URL        | 'http://localhost:8080/proxy/deuna-msa-nb-orq-transaction.cnb.svc.cluster.local/api/v1'      |
| MSA_TL_TEMPLATE_GENERATOR_URL     | 'http://localhost:8080/proxy/deuna-tl-template-generator.core.eks.local'                     |


## Ejecucion del Microservicio

### Usando contenedores

```bash
make build-dev
make install-dependencies
make launch-local
```

### Usando Nodejs standalone

1. Instale las dependencias:
   ```
   npm install
   ```

2. Configure las variables de entorno:
   ```
   cp .env.example .env
   ```
   Edite el archivo `.env` con los valores apropiados para su entorno.

3. Inicie el servidor de desarrollo:
   ```
   npm run start:dev
   ```

## Ejecucion de pruebas unitarias

Para ejecutar todas las pruebas unitarias, use el siguiente comando:

```bash
npm run test
```

Para ejecutar las pruebas con cobertura:

```bash
npm run test:cov
```

Para ejecutar las pruebas en modo watch:

```bash
npm run test:watch
```

## Cobertura de Código

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

## Documentación Adicional

Para más información sobre el proyecto y sus componentes, consulte los siguientes recursos:

- [Error manejando dependencias](./docs/issues_dependencies.md)
- [Manejo de Errores](./docs/error-Handling-guide.md)
- [Documentación de la API GraphQL](./docs/graphql-api.md)
- [Guía de Desarrollo](./docs/development-guide.md)

Si tiene alguna pregunta o problema, no dude en abrir un issue en el repositorio o contactar al equipo de desarrollo.
