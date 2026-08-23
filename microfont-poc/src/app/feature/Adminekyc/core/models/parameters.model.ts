export interface AdminParameter {
  /** APP_SETTINGS.KEY / Spring ParamName is the parameter identifier. */
  id: string;
  parameterName: string;
  parameterValue: string;
  parameterDescription: string;
  privacyLevel: string;
}

export interface ParameterFormValue {
  parameterName: string;
  parameterValue: string;
  parameterDescription: string;
  privacyLevel: string;
}
