export interface AdminFunctionAccess {
  targetPath: string;
  allowAddFlag: number;
  allowEditFlag: number;
  allowDeleteFlag: number;
  allowViewFlag: number;
  allowAuthFlag: number;
  allowProcessFlag: number;
  allowReportViewFlag: number;
  allowReportPrintFlag: number;
  allowReportGenFlag: number;
}

/**
 * Frontend-friendly representation of the authenticated Spring session user.
 * Backend JsonProperty DTOs are kept separate in adminekyc-account-auth.model.ts.
 */
export interface AdminUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: string;
  status: 'active' | 'inactive' | string;

  userId: string;
  loginId: string;
  homeBranchId: string;
  homeBranchName: string;
  sessionId: string;
  functionAccess: AdminFunctionAccess[];

  /** Legacy field retained only for safe deserialization of older session data. */
  adminPassword?: string;
}
