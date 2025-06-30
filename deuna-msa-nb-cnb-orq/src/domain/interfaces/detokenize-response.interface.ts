/**
 * Interface for detokenize responses
 */
export interface IDetokenizeResponse {
  /**
   * Base64 image data resulting from detokenization
   */
  imageData: string;
  
  /**
   * Status of the detokenization request
   */
  status: string;
  
  /**
   * Additional information if needed
   */
  message?: string;
} 