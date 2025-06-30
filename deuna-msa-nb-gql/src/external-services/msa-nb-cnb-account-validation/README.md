# MSA NB CNB Account Validation

Microservicio para validar cuentas CNB antes de generar códigos QR de retiro.

## Descripción

Este microservicio se encarga de validar el estado de las cuentas CNB (Cuenta Nacional Bancaria) antes de permitir la generación de códigos QR para retiros. La validación incluye:

- Verificación del estado de la cuenta (activa/inactiva)
- Verificación del saldo disponible
- Validación de la moneda de la cuenta

## Funcionalidades

### Validación de Cuenta

Endpoint: `GET /api/v1/cnb/account/validate`

**Parámetros:**
- `accountNumber` (string): Número de cuenta CNB a validar

**Respuesta exitosa:**
```json
{
  "status": "success",
  "data": {
    "accountNumber": "123456789",
    "accountStatus": "active",
    "balance": 1000.0,
    "currency": "USD",
    "isActive": true
  },
  "message": "Account validation successful"
}
```

**Respuesta de error (404):**
```json
{
  "status": "error",
  "error": {
    "code": "CNB_ACCOUNT_NOT_FOUND",
    "message": "CNB account not found or inactive",
    "details": {
      "accountNumber": "123456789"
    }
  }
}
```

## Configuración

### Variables de Entorno

- `MSA_NB_CNB_ACCOUNT_VALIDATION_BASE_URL`: URL base del microservicio (default: http://localhost:3001)

## Uso en GraphQL

El microservicio se integra con el resolver de GraphQL `generate-qr` para validar la cuenta antes de generar el código QR:

```typescript
// En el resolver de generate-qr
const accountValidation = await this.cnbAccountValidationService.validateAccount({
  accountNumber: customerInfo.clientAcountId,
});

if (!accountValidation.data.isActive) {
  throw new Error('CNB account is not active');
}
```

## Pruebas

### Servicio Real
```bash
npm run test:external-services:cnb-account-validation
```

### Servicio Fake
El servicio fake permite simular diferentes escenarios:
- Cuentas activas con saldo: `ACTIVE_BALANCE_123`
- Cuentas activas sin saldo: `ACTIVE_123`
- Cuentas inactivas: `INACTIVE_123`

## Estructura del Proyecto

```
msa-nb-cnb-account-validation/
├── dto/
│   ├── cnb-account-validation.input.dto.ts
│   └── cnb-account-validation.response.dto.ts
├── interfaces/
│   └── msa-nb-cnb-account-validation-service.interface.ts
├── providers/
│   └── msa-nb-cnb-account-validation-service.provider.ts
├── services/
│   ├── rest-msa-nb-cnb-account-validation.service.ts
│   ├── fake-msa-nb-cnb-account-validation.service.ts
│   └── msa-nb-cnb-account-validation.service.spec.ts
├── msa-nb-cnb-account-validation.module.ts
└── README.md
```

## Reglas de Negocio

1. **Validación previa**: La validación debe ejecutarse antes de generar el QR
2. **Estado activo**: La cuenta debe estar en estado "activo"
3. **Error 404**: Para cuentas inactivas o no encontradas, se debe retornar error 404
4. **Saldo**: Se debe verificar que la cuenta tenga saldo disponible

## Criterios de Aceptación

### Escenario: Validación antes de generar QR
- **Dado**: El CNB solicita generar un código QR para un retiro
- **Cuando**: El sistema detecta que su cuenta está inactiva o bloqueada
- **Entonces**: Deberá mostrar un mensaje de error y bloquear la acción

### Escenario: CNB con saldo y cuenta activa
- **Dado**: El CNB cumple con los requisitos
- **Entonces**: Podrá continuar con la generación del QR sin restricciones 