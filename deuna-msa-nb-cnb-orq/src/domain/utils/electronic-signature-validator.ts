import { ValidationError } from '../errors/validation-error';
import { IElectronicSignatureData } from '../interfaces/electronic-signature-data.interface';

/**
 * Validates that a required field is not null, undefined, or empty
 * @param value - Value to validate
 * @param fieldName - Name of the field for the error message
 * @throws ValidationError if the value is null, undefined, or empty
 */
export const validateRequiredField = (value: any, fieldName: string): void => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '')
  ) {
    throw new ValidationError(
      `The field ${fieldName} is required and cannot be empty`,
    );
  }
};

/**
 * Validates that the required fields of the electronic signature exist and are not empty
 * @param data - Electronic signature data to validate
 * @throws ValidationError if any required field is missing or empty
 */
export const validateElectronicSignatureData = (
  data: IElectronicSignatureData,
): void => {
  // Validate that the data object exists
  if (!data) {
    throw new ValidationError('The electronic signature data is required');
  }

  // Validate required fields
  validateRequiredField(data.identificationNumber, 'identificationNumber');
  validateRequiredField(data.applicantName, 'applicantName');
  validateRequiredField(data.applicantLastName, 'applicantLastName');
  validateRequiredField(data.fingerCode, 'fingerCode');
  validateRequiredField(data.emailAddress, 'emailAddress');
  validateRequiredField(data.cellphoneNumber, 'cellphoneNumber');
  validateRequiredField(data.city, 'city');
  validateRequiredField(data.province, 'province');
  validateRequiredField(data.address, 'address');
  validateRequiredField(
    data.fileIdentificationFront,
    'fileIdentificationFront',
  );
  validateRequiredField(data.fileIdentificationBack, 'fileIdentificationBack');
  validateRequiredField(
    data.fileIdentificationSelfie,
    'fileIdentificationSelfie',
  );

  // Validación de formato de email (básica)
  const emailRegex = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
  if (!emailRegex.test(data.emailAddress)) {
    throw new ValidationError(
      'The field emailAddress must have a valid email format',
    );
  }
};
