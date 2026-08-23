import { AdminCustomer, AdminCustomerStatus } from './admin-customer.model';

/** Exact JsonProperty contract returned for each customer in list/search APIs. */
export interface AdminekycCustomerListItemResponse {
  Fullname: string | null;
  MotherNameEN: string | null;
  FatherNameEN: string | null;
  Religion: number | null;
  Email: string | null;
  MobileNo: string | null;
  NidNo: string | null;
  DOB: string | null;
  Gender: string | null;
  Branch: string | null;
  Product: string | null;
  Profession: string | null;
  AuthStatus: string | null;
  TrackingNo: number | null;
  TrackingNoStr: string | null;
  ImageBase64: string | null;
  SearchTerm: string | null;
  FaceMatchScore: number | null;
  RiskScore: number | null;
  MakeDate: string | null;
  MakeBy: string | null;
  AuthBy: string | null;
  AuthDate: string | null;
  DeclineReason: string | null;
  DeclineReasonTrimmed: string | null;
  TrackingStatus: string | null;
  AccountNo: string | null;
  CustomerId: string | null;
  NomineeName1: string | null;
  NomineeName2: string | null;
  PermanentAddress: string | null;
  custEkycType: string | null;
  source_of_fund: string | null;
  PRODUCT_NM: string | null;
  Tenure: string | null;
  TRM_FREQ: string | null;
  TRM_TOT_NO: string | null;
  FUTURE_AMT: string | null;
  INSTL_AMT: string | null;
  MATURITY_AMT: string | null;
  PRINCIPAL_AMT: string | null;
  ACC_OPEN_DT: string | null;
  ACC_MATURITY_DT: string | null;
}

export interface AdminekycProductTypeOptionResponse {
  ProductTypeId: string | null;
  ProductTypeName: string | null;
  ProductTypeShortName: string | null;
}

/** Exact Result payload returned by the customer list/search endpoints. */
export interface AdminekycCustomerPageResponse {
  Customers: AdminekycCustomerListItemResponse[];
  ProductTypes: AdminekycProductTypeOptionResponse[];
  PageNumber: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
  AuthType: string | null;
  IsHeadOffice: boolean;
  Model: string | null;
}

/** Core search query independent from the page/form component. */
export interface AdminekycCustomerSearchQuery {
  branchId?: string;
  mobileNumber?: string;
  trackingNumber?: string;
  nidNumber?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  accountFrom?: string;
  accountTo?: string;
}

/** UI-facing server page after mapping Spring response fields. */
export interface AdminCustomerPage {
  customers: AdminCustomer[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  authType: AdminCustomerStatus;
  isHeadOffice: boolean;
}
