/** Exact JSON contract for POST /api/Account/Validate. */
export interface AdminekycLoginRequest {
  UserName: string;
  Password: string;
}

/** Exact JsonProperty contract returned inside CurrentUser. */
export interface AdminekycFunctionAccessResponse {
  TargetPath: string;
  AllowAddFlag: number;
  AllowEditFlag: number;
  AllowDeleteFlag: number;
  AllowViewFlag: number;
  AllowAuthFlag: number;
  AllowProcessFlag: number;
  AllowReportViewFlag: number;
  AllowReportPrintFlag: number;
  AllowReportGenFlag: number;
}

export interface AdminekycCurrentUserResponse {
  UserId: string;
  LoginId: string;
  UserNm: string;
  HomeBranchId: string;
  HomeBranchName: string;
  SessionId: string;
  UserFunctionAccess: AdminekycFunctionAccessResponse[];
}

/** Result payload returned by POST /api/Account/Validate. */
export interface AdminekycLoginResponse {
  CurrentUser: AdminekycCurrentUserResponse;
}

/** Result payload returned by GET /api/Account/getUserName. */
export interface AdminekycSessionUserResponse {
  UserName: string;
  UserBranch: string;
  UserBranchName: string;
}
