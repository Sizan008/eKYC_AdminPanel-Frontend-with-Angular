export interface ConversionResponse {
  success: boolean;
  message: string;
  convertedFileName?: string;
  downloadUrl?: string;
  convertedContent?: string; 
}