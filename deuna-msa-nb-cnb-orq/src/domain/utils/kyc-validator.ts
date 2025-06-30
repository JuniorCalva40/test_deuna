import { ValidationError } from '../errors/validation-error';

// Interfaces para manejar los diferentes formatos de datos
interface IFacialValidationStandard {
  documentImage: string;
  selfieImage: string;
  documentType: string;
}

interface IFacialValidationAlternative {
  token1: string;
  token2: string;
  method: number;
}

// Type union that accepts both formats
type FacialValidationInput = Partial<
  IFacialValidationStandard & IFacialValidationAlternative
>;

interface ILivenessValidationStandard {
  selfieImage: string;
  livenessData: string;
}

interface ILivenessValidationAlternative {
  imageBuffer: string;
}

// Type union that accepts both formats
type LivenessValidationInput = Partial<
  ILivenessValidationStandard & ILivenessValidationAlternative
>;

/**
 * Validates that an object is not null or undefined
 * @param value - Value to validate
 * @param fieldName - Name of the field for the error message
 * @throws ValidationError if the value is null or undefined
 */
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === null || value === undefined) {
    throw new ValidationError(`The field ${fieldName} is required`);
  }
};

/**
 * Validates that a string is not empty
 * @param value - String to validate
 * @param fieldName - Name of the field for the error message
 * @throws ValidationError if the string is empty
 */
export const validateString = (value: string, fieldName: string): void => {
  if (!value || value.trim() === '') {
    throw new ValidationError(
      `The field ${fieldName} is required and cannot be empty`,
    );
  }
};

/**
 * Validates that a base64 string is not empty
 * @param value - Base64 string to validate
 * @param fieldName - Name of the field for the error message
 * @throws ValidationError if the string is empty or invalid
 */
export const validateBase64 = (value: string, fieldName: string): void => {
  validateString(value, fieldName);

  // Debugging: Log the first few characters of the value
  console.log(
    `Validating ${fieldName}:`,
    value ? `${value.substring(0, 30)}...` : 'EMPTY',
  );

  // Allow both pure base64 and data URI prefixed format
  try {
    if (value.includes('base64,')) {
      // If it has a data URI prefix (e.g. data:image/jpeg;base64,ABC123...)
      const base64Part = value.split('base64,')[1];
      if (!base64Part || base64Part.trim() === '') {
        throw new ValidationError(
          `The field ${fieldName} does not contain valid base64 data`,
        );
      }
    } else {
      // If it's pure base64, try to verify it's valid
      // This is a basic validation that could be improved
      if (!/^[A-Za-z0-9+/=]+$/.test(value)) {
        throw new ValidationError(
          `The field ${fieldName} does not contain valid base64 characters`,
        );
      }
    }
  } catch (error) {
    // If any error occurs during validation
    if (error instanceof ValidationError) {
      throw error;
    }

    // Log the specific error to help with debugging
    console.error(`Error validating ${fieldName}:`, error);

    throw new ValidationError(
      `The field ${fieldName} contains an invalid base64 format`,
    );
  }
};

/**
 * Validates facial validation data
 * @param facialValidation - Facial validation data
 * @throws ValidationError if any required field is empty
 */
export const validateFacialValidation = (
  facialValidation: FacialValidationInput,
): void => {
  validateRequired(facialValidation, 'facialValidation');

  // Validate structure based on the fields sent
  // Structure received: token1, token2, method
  const documentImage =
    facialValidation.token1 || facialValidation.documentImage;
  const selfieImage = facialValidation.token2 || facialValidation.selfieImage;

  if (!documentImage) {
    throw new ValidationError(`Se requiere el campo documentImage o token1`);
  }

  if (!selfieImage) {
    throw new ValidationError(`Se requiere el campo selfieImage o token2`);
  }

  validateBase64(documentImage, 'documentImage/token1');
  validateBase64(selfieImage, 'selfieImage/token2');

  // Allow method as a number instead of documentType as a string
  if (!facialValidation.method && !facialValidation.documentType) {
    throw new ValidationError(`Se requiere el campo method o documentType`);
  }
};

/**
 * Validates liveness validation data
 * @param livenessValidation - Liveness validation data
 * @throws ValidationError if any required field is empty
 */
export const validateLivenessValidation = (
  livenessValidation: LivenessValidationInput,
): void => {
  validateRequired(livenessValidation, 'livenessValidation');

  // Accept imageBuffer as an alternative to selfieImage
  const selfieImage =
    livenessValidation.imageBuffer || livenessValidation.selfieImage;

  if (!selfieImage) {
    throw new ValidationError(`Se requiere el campo selfieImage o imageBuffer`);
  }

  validateBase64(selfieImage, 'selfieImage/imageBuffer');

  // If selfieImage and livenessData do not exist but imageBuffer does, use imageBuffer as both
  if (
    !livenessValidation.livenessData &&
    !livenessValidation.selfieImage &&
    livenessValidation.imageBuffer
  ) {
    // We already validated imageBuffer, so we don't need to validate it again
  } else if (livenessValidation.livenessData) {
    validateBase64(livenessValidation.livenessData, 'livenessData');
  } else if (livenessValidation.imageBuffer) {
    // If there is no livenessData but there is imageBuffer, we don't need to validate more
  } else {
    throw new ValidationError(
      `Se requiere al menos imageBuffer o livenessData`,
    );
  }
};

/**
 * Validates all necessary data to start the KYC validation
 * @param facialValidation - Facial validation data
 * @param livenessValidation - Liveness validation data
 * @param onboardingSessionId - Onboarding session ID
 * @param sessionId - Session ID
 * @param trackingId - Tracking ID
 * @throws ValidationError if any required field is empty
 */
export const validateKycData = (
  facialValidation: FacialValidationInput,
  livenessValidation: LivenessValidationInput,
  onboardingSessionId: string,
  sessionId: string,
  trackingId: string,
): void => {
  // The scanId can be optional because it is generated if not provided

  // Validate facial validation data
  validateFacialValidation(facialValidation);

  // Validate liveness validation data
  validateLivenessValidation(livenessValidation);

  // Validate session and tracking IDs
  validateString(sessionId, 'sessionId');
  validateString(trackingId, 'trackingId');
  validateString(onboardingSessionId, 'onboardingSessionId');
};
