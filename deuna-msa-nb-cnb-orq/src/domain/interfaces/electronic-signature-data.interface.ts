/**
 * Interface that defines the data structure for electronic signature requests
 * based on the API requirements
 */
export interface IElectronicSignatureData {
  // Required fields
  identificationNumber: string;
  applicantName: string;
  applicantLastName: string;
  fingerCode: string;
  emailAddress: string;
  cellphoneNumber: string;
  city: string;
  province: string;
  address: string;
  fileIdentificationFront: string;
  fileIdentificationBack: string;
  fileIdentificationSelfie: string;

  // Optional fields
  applicantSecondLastName?: string;
  companyRuc?: string;
}
