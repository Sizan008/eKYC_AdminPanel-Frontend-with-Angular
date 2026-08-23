import type {
  AdminekycCustomerDetailsResponse,
  AdminekycCustomerNomineeResponse
} from './adminekyc-customer-details.model';

/** UI row for the server-backed KYC Report customer list. */
export interface KycReportCustomer {
  id: number;
  trackingNo: number;
  fullName: string;
  mobileNo: string;
  nidNo: string;
  customerId: string;
  branch: string;
  accountNo: string;
  faceMatchScore: number | null;
  authStatus: string;
  makeDate: string;
  imageUrl: string;
}

/** UI-facing server page returned by GET /api/CustomerProfile/KYCReportByYear. */
export interface KycReportPage {
  customers: KycReportCustomer[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface KycReportDetailsData {
  profile: AdminekycCustomerDetailsResponse;
  nominee: AdminekycCustomerNomineeResponse | null;
}

/** Old .NET KYC screen treats Year as a non-negative "years back" value. */
export interface KycReportYearFormValue {
  year: number | null;
}

/** Raw response returned by GET /api/CustomerProfile/Excel. */
export interface KycCustomerExportResponse {
  pdfData?: string | null;
  docname?: string | null;
}

/** Raw response returned by GET /api/CustomerProfile/GenerateReport. */
export interface KycCustomerReportResponse {
  isSuccess?: boolean;
  pdfData?: string | null;
  errorMessage?: string | null;
  result?: string | null;
}

/** Raw response returned by GET /api/Report/GetMergedCustPhotoAndSignature. */
export interface KycMergedPhotoResponse {
  pdfData?: string | null;
  result?: string | null;
}

/** Values persisted by POST /api/CustomerProfile/UpdateServices. */
export interface KycServiceApprovalUpdate {
  smsAlertFlag: 0 | 2;
  emailAlertFlag: 0 | 2;
  debitCardFlag: 0 | 2;
  chqBookFlag: 0 | 2;
}

export interface KycDownloadFile {
  blob: Blob;
  fileName: string;
}
