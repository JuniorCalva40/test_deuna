# Documentación de la API GraphQL

Esta documentación proporciona una visión general de la API GraphQL para el proceso de onboarding de CNB (Corresponsal No Bancario).

## Índice

1. [Introducción](#introducción)
2. [Queries](#queries)
   - [queryDocument](#querydocument)
   - [queryOnboardingStatus](#queryonboardingstatus)
   - [validateCnbState](#validatecnbstate)
3. [Mutations](#mutations)
   - [acceptBilling](#acceptbilling)
   - [acceptContract](#acceptcontract)
   - [confirmData](#confirmdata)
   - [signContract](#signcontract)
   - [startOnboarding](#startonboarding)
4. [Tipos de Datos](#tipos-de-datos)
5. [Manejo de Errores](#manejo-de-errores)

## Introducción

La API GraphQL proporciona una interfaz para interactuar con el proceso de onboarding de CNB. Permite realizar operaciones como iniciar el onboarding, confirmar datos, aceptar facturación, firmar contratos y consultar el estado del onboarding.

## Queries

### queryDocument

Consulta un documento específico.

```graphql
query {
  queryDocument(input: QueryDocumentInput!): QueryDocumentResponse!
}
```

Parámetros:
- `input`: QueryDocumentInput
  - `templateName`: String! (Nombre de la plantilla del documento)

Respuesta:
- `QueryDocumentResponse`
  - `status`: String!
  - `message`: String!
  - `data`: QueryDocumentData!
    - `presignedUrl`: String!
    - `b64encoded`: String!
  - `errors`: [ErrorDetail!]

### queryOnboardingStatus

Consulta el estado actual del proceso de onboarding.

```graphql
query {
  queryOnboardingStatus(sessionId: String!): QueryOnboardingStatusDto!
}
```

Parámetros:
- `sessionId`: String! (ID de la sesión de onboarding)

Respuesta:
- `QueryOnboardingStatusDto`
  - `id`: Int!
  - `sessionId`: String!
  - `securitySeed`: String!
  - `identityId`: String!
  - `onbType`: String!
  - `data`: OnboardingData!
  - `status`: String!
  - `publicKey`: String!
  - `createdAt`: DateTime!
  - `updatedAt`: DateTime!

### validateCnbState

Valida el estado de un CNB.

```graphql
query {
  validateCnbState(userName: String!): DataResponse!
}
```

Parámetros:
- `userName`: String! (Nombre de usuario del CNB)

Respuesta:
- `DataResponse`
  - `status`: String!
  - `cnbState`: String!
  - `errors`: [ErrorDto!]

## Mutations

### acceptBilling

Acepta la facturación en el proceso de onboarding.

```graphql
mutation {
  acceptBilling(input: AcceptBillingInput!): AcceptBillingResponse!
}
```

Parámetros:
- `input`: AcceptBillingInput
  - `sessionId`: String!

Respuesta:
- `AcceptBillingResponse`
  - `sessionId`: String!
  - `status`: String!
  - `errors`: [ErrorDetail!]

### acceptContract

Acepta el contrato en el proceso de onboarding.

```graphql
mutation {
  acceptContract(input: AcceptContractDataInputDto!): AcceptContractDataResponseDto!
}
```

Parámetros:
- `input`: AcceptContractDataInputDto
  - `sessionId`: String!
  - `businessDeviceId`: String!
  - `deviceName`: String!

Respuesta:
- `AcceptContractDataResponseDto`
  - `sessionId`: String!
  - `requestId`: String!
  - `otpResponse`: GenerateOtpRespDto!
  - `status`: String!
  - `errors`: [ErrorDetail!]

### confirmData

Confirma los datos del CNB en el proceso de onboarding.

```graphql
mutation {
  confirmData(input: ConfirmDataInputDto!): ConfirmDataResponseDto!
}
```

Parámetros:
- `input`: ConfirmDataInputDto
  - `sessionId`: String!
  - `establishment`: EstablishmentInputDto!
    - `fullAddress`: String!
    - `numberEstablishment`: String!

Respuesta:
- `ConfirmDataResponseDto`
  - `cnbClientId`: String!
  - `sessionId`: String!
  - `status`: String!
  - `errors`: [ErrorDetail!]

### signContract

Firma el contrato en el proceso de onboarding.

```graphql
mutation {
  signContract(input: SignContractInput!): SignContractResponse!
}
```

Parámetros:
- `input`: SignContractInput
  - `sessionId`: String!
  - `businessDeviceId`: String!
  - `requestId`: String!
  - `otp`: Float!

Respuesta:
- `SignContractResponse`
  - `status`: String!
  - `message`: String!
  - `errorCode`: String
  - `details`: SignContractResponseDetails
  - `errors`: [ErrorDetail!]

### startOnboarding

Inicia el proceso de onboarding para un nuevo CNB.

```graphql
mutation {
  startOnboarding(input: StartOnboardingInput!): StartOnboardingResponse!
}
```

Parámetros:
- `input`: StartOnboardingInput
  - `username`: String!

Respuesta:
- `StartOnboardingResponse`
  - `sessionId`: String!
  - `companyName`: String!
  - `ruc`: Int!
  - `email`: String!
  - `establishments`: [EstablishmentOutputDto!]!
  - `fullName`: String!
  - `status`: String!
  - `errors`: [ErrorDetail!]

## Tipos de Datos

La API utiliza varios tipos de datos personalizados. Algunos de los más importantes son:

- `EstablishmentInputDto`: Representa los datos de un establecimiento.
  - `fullAddress`: String!
  - `numberEstablishment`: String!

- `EstablishmentOutputDto`: Representa los datos de salida de un establecimiento.
  - `fullAddress`: String!
  - `numberEstablishment`: String!

- `ErrorDetail`: Detalles de un error.
  - `message`: String!
  - `code`: String!

- `GenerateOtpRespDto`: Respuesta de generación de OTP.
  - `expirationDate`: String!
  - `remainingResendAttempts`: Float!

- `OnboardingData`: Datos del proceso de onboarding.
  - `startOnbCnb`: StartOnbCnbResp
  - `confirmData`: ConfirmData
  - `acceptBilling`: AcceptBilling
  - `acceptContract`: AcceptContract

Para una lista completa de tipos, consulte el esquema GraphQL completo.

## Manejo de Errores

Los errores en la API se manejan a través del campo `errors` en las respuestas. Cada error contiene:

- `message`: Descripción del error.
- `code`: Código único del error.

Ejemplo de respuesta con error:

```json
{
  "data": null,
  "errors": [
    {
      "message": "No se pudo encontrar el usuario",
      "code": "USER_NOT_FOUND"
    }
  ]
}
```

Es importante manejar estos errores adecuadamente en el cliente para proporcionar una buena experiencia de usuario.

Códigos de error comunes:

- `USER_NOT_FOUND`: El usuario especificado no se encontró.
- `INVALID_INPUT`: Los datos de entrada son inválidos o incompletos.
- `UNAUTHORIZED`: El usuario no tiene permisos para realizar la operación.
- `INTERNAL_SERVER_ERROR`: Error interno del servidor.

Asegúrese de manejar tanto los errores específicos como los errores generales en su aplicación cliente.
