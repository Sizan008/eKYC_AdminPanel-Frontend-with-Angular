export class AuthorizationModel {
  branchId: string;
  msgType: number;
  refNo: string | null;
  msgFromDate: string;
  msgToDate: string;
  orgnBrId: string | null;
}

// CBS Data Interface - Updated to match backend response
export interface CBSData {
  msgRefNo: string;
  makeBy: string;
  makeDate: string;
  issueDate: string;
  auth1stBy: string;
  auth1stDate: string;
}
