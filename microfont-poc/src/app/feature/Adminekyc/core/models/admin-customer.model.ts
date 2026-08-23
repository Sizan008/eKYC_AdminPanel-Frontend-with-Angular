export type AdminCustomerStatus =
  | 'authorized'
  | 'unauthorized'
  | 'incomplete'
  | 'declined';

export type AdminCustomerVerificationStatus =
  | 'matched'
  | 'mismatched'
  | 'pending'
  | 'completed'
  | string;

export interface AdminCustomerAlerts {
  debitRestrictionWithdrawal?: boolean;
  smsAlert?: boolean;
  smsAlertDone?: boolean;
  emailAlert?: boolean;
  emailAlertDone?: boolean;
  chequeAlert?: boolean;
  chequeAlertDone?: boolean;
  debitAlert?: boolean;
  debitAlertDone?: boolean;
  debitRestrictionHidden?: boolean;
}

export interface AdminCustomerDocuments {
  customerPhotoUrl?: string;
  nidPhotoUrl?: string;
  porichoyPhotoUrl?: string;
  capturedPhotoUrl?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  signatureUrl?: string;
  nomineePhotoUrl?: string;
}

export interface AdminCustomerVerification {
  faceMatchScore?: number;
  faceThreshold?: number;
  authentication?: string;
  faceVerificationStatus?: AdminCustomerVerificationStatus;
  nidVerificationStatus?: AdminCustomerVerificationStatus;
  documentVerificationStatus?: AdminCustomerVerificationStatus;
  ocrVerificationStatus?: AdminCustomerVerificationStatus;
}

export interface AdminCustomerNominee {
  name?: string;
  relation?: string;
  nidNo?: string;
  mobileNo?: string;
}

export interface AdminCustomer {
  id: number;

  applicationId: string;
  trackingNo?: string;
  customerId?: string;
  accountNo?: string;

  customerName: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  gender?: string;
  dateOfBirth?: string;
  nidNo?: string;
  mobileNo?: string;
  email?: string;
  religion?: string;

  occupation?: string;
  designation?: string;
  monthlyIncome?: number;
  sourceOfFund?: string;
  tin?: string;

  branch?: string;
  branchInfo?: string;
  presentAddress?: string;
  permanentAddress?: string;

  productType?: string;
  accountType?: string;
  productTypeName?: string;
  customerEkycType?: string;
  accountStatus?: string;
  stepNo?: number;

  sanctionScreening?: string;
  depositPerMonth?: number;
  withdrawalPerMonth?: number;
  onboardedFrom?: string;
  fatcaChecked?: string;
  rmCode?: string;
  riskGrading?: number;
  maximumRiskGrading?: number;
  eddCheck?: number;
  bankShortName?: string;
  authPermission?: boolean;
  pendingBranchAuthorization?: boolean;
  loanBoAcceptanceReason?: string;

  alerts?: AdminCustomerAlerts;
  nominee?: AdminCustomerNominee;
  documents?: AdminCustomerDocuments;
  verification?: AdminCustomerVerification;

  status: AdminCustomerStatus;
  authorizationType?: string | null;
  authorizedBy?: string | null;
  authorizedAt?: string | null;
  unauthorizedReason?: string | null;

  createdAt?: string;
  makeDate?: string;

  declinedBy?: string;
 declinedAt?: string;
 declinedReason?: string;
}