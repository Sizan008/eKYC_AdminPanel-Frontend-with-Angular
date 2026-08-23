/** Exact Spring Boot JSON contract for ParameterConfig endpoints. */
export interface AdminekycParameterResponse {
  ParamName: string | null;
  ParamValue: string | null;
  Description: string | null;
  PrivacyLevel: string | null;
}

export interface AdminekycParameterRequest {
  ParamName: string;
  ParamValue: string;
  Description: string | null;
  PrivacyLevel: string | null;
}
