/**
 * Interfaces que definen la estructura de respuesta de validación KYC
 * basadas en la estructura real de respuestas
 */

// Detalles comunes para todas las respuestas de validación
export interface ValidationResultDetailsBase {
  serviceResultCode: number;
  serviceResultLog: string;
  serviceTime: string;
  serviceTransactionId: string;
  [key: string]: any; // Para campos adicionales
}

// Detalles específicos para Liveness
export interface LivenessValidationDetails extends ValidationResultDetailsBase {
  serviceLivenessResult: number; // El resultado es un número, no un booleano
}

// Detalles específicos para Facial
export interface FacialValidationDetails extends ValidationResultDetailsBase {
  serviceFacialAuthenticationHash: string;
  serviceFacialAuthenticationResult: number; // El resultado es un número, no un booleano
  serviceFacialSimilarityResult: number;
}

// Estructura base para todas las respuestas
export interface KycValidationResultBase {
  success: boolean;
  status: string;
  timestamp: string;
  details: ValidationResultDetailsBase;
}

// Resultado específico de validación de Liveness
export interface LivenessValidationResult extends KycValidationResultBase {
  details: LivenessValidationDetails;
}

// Resultado específico de validación Facial
export interface FacialValidationResult extends KycValidationResultBase {
  details: FacialValidationDetails;
}

// Tipo unión para cualquier resultado de validación
export type KycValidationResult =
  | LivenessValidationResult
  | FacialValidationResult;

// Datos para solicitud de validación
export interface LivenessValidationData {
  selfieImage?: string;
  imageBuffer?: string; // Formato antiguo
  livenessData?: any;
  [key: string]: any;
}

export interface FacialValidationData {
  selfieImage?: string;
  documentImage?: string;
  documentType?: string;
  token1?: string; // Formato antiguo
  token2?: string; // Formato antiguo
  [key: string]: any;
}
