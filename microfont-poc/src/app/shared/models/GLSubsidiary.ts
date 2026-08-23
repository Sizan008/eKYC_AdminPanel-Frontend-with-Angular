import { BaseModel } from "./base.model";

export class GLSubsidiaryModel extends BaseModel{
  regId : string|null;
  officeId : string|null;
  glAccSl : number|null;
  glAccNo : string|null;
  glAccName : string|null;
  glAccSubSl : string|null;
  glAccSubNm : string|null;
  glAccType : string | null;
  currencyCode : string | null;
  glSubRefNo  : string | null;
  entryDt : Date|null;
  lastEntryNo : string|null;
  adjustmentDt : string|null;
  pglOthCode : string|null;
  expRegType : string|null;
  departmentId : string|null;
  employeeId : string|null;
  entityId : string | null;
  glOthCode : string | null;
  glBankOffice : string | null;
}



export interface GLSubAccountInfoRequest {
  pofficeId: number;
  pglAccSl: number;
  pglAccSubSl: string;
  pqueueId: string;
}
export interface GLSubsidiaryResponse {
  pglAccSubSl : string|null;
  prowId : string|null;
  pregId : string|null;
  errorMsg : string|null;
}



export interface GetGlSubsidiaryAccountListRequest {
  pnameValueList: string;
  pofficeId: string;
  pglAccSl: string;
}

export interface GetGlSubsidiaryAccountListResponse {
  glAccSubSl: number;
  glAccSubNm: string;
}