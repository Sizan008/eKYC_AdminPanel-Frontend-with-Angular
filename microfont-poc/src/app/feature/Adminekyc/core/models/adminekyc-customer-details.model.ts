/** Raw action response returned by CustomerProfile action endpoints. */
export interface AdminekycCustomerActionResponse {
  message?: string | null;
  status?: string | null;
  result?: unknown;
}

/** Exact JsonProperty contract returned by the nested Photos payload. */
export interface AdminekycCustomerPhotosResponse {
  NidFront: string | null;
  NidBack: string | null;
  FromNid: string | null;
  FromPorichoy: string | null;
  FromUploaded: string | null;
  FromSignature: string | null;
}

/** Exact Result payload returned by GET /api/CustomerProfile/DetailsMain. */
export interface AdminekycCustomerDetailsResponse {
  TrackingNo: number | null;
  TrackingStatus: number | null;
  MobileNo: string | null;
  Email: string | null;
  NidNo: string | null;
  FullnameEN: string | null;
  FullnameBN: string | null;
  Birthdate: string | null;
  Gender: string | null;
  Religion: number | null;
  Profession: string | null;
  DepositPerMonth: number | null;
  WithdrawPerMonth: number | null;
  RiskGrading: number | null;
  maxRiskGrading: number | null;
  MotherNameEN: string | null;
  MotherNameBN: string | null;
  FatherNameEN: string | null;
  FatherNameBN: string | null;
  SpouseName: string | null;
  PresentAddressEN: string | null;
  PresentAddressBN: string | null;
  PermanentAddress: string | null;
  Country: string | null;
  Division: number | null;
  District: number | null;
  SubDistrict: number | null;
  Thana: number | null;
  BranchId: string | null;
  BranchName: string | null;
  ProductId: string | null;
  ProductName: string | null;
  ProductTypeId: string | null;
  ProductTypeName: string | null;
  ProductCount: number | null;
  CustomerId: string | null;
  AccountNo: string | null;
  FaceMatchScoreCard: number | null;
  AuthStatus: string | null;
  AuthBy: string | null;
  CheckBoxValue: boolean;
  Remark: string | null;
  isActive: boolean;
  RequestChannel: string | null;
  Edd_Check: number | null;
  DeclineReason: string | null;
  CustPhoto: string | null;
  NidFront: string | null;
  NidBack: string | null;
  PorichoyPhoto: string | null;
  NidPhoto: string | null;
  SignPhoto: string | null;
  SacntionScreening: string | null;
  custEkycType: string | null;
  checkBy: string | null;
  checkDate: string | null;
  authBy: string | null;
  authDate: string | null;
  SmsAlertFlag: number | null;
  EmailAlertFlag: number | null;
  ChqBookFlag: number | null;
  DebitCardFlag: number | null;
  FatkaChecked: boolean;
  UpdateBy: string | null;
  rmcode: string | null;
  AccountStatus: string | null;
  ReferenceNo: number | null;
  AuthPermission: boolean;
  PendingBranchAuthorization: boolean;
  NomineeCount: number | null;
  GuardianCount: number | null;
  BeneficiaryCount: number | null;
  DocumentCount: number | null;
  SSLPayment: boolean;
  DebitRestriction: AdminekycCustomerActionResponse | null;
  Photos: AdminekycCustomerPhotosResponse | null;
  BankShNm: string | null;
  RISK_GRADING_DETAILS: string | null;
  EDD_DETAILS: string | null;
  ShowAlerts: string | null;
  ShowAlertsAllChannels: string | null;
  ShowRiskGradeAllEKYC: string | null;
  ReturnThisCust2PreviousStep: string | null;
  GuardianList: unknown[];
  JointPartnerList: AdminekycCustomerDetailsResponse[];
}

/** Exact Result payload returned by GET /api/CustomerProfile/NomineeDetails. */
export interface AdminekycCustomerNomineeResponse {
  TrackingNo: number | null;
  NomineeNo: number | null;
  NomineeName: string | null;
  NomineeIdType: number | null;
  NomineeIdNo: string | null;
  Birthdate: string | null;
  Gender: string | null;
  Religion: number | null;
  Relation: string | null;
  Age: number | null;
  SharePercent: number | null;
  MotherNameEN: string | null;
  MotherNameBN: string | null;
  FatherNameEN: string | null;
  FatherNameBN: string | null;
  PresentAddressEN: string | null;
  PresentAddressBN: string | null;
  PermanentAddress: string | null;
  Country: string | null;
  Division: number | null;
  District: number | null;
  SubDistrict: number | null;
  Thana: number | null;
  ZipCode: string | null;
  OtherInfo: string | null;
  Status: string | null;
  NomineePhoto: string | null;
  NomineeNidFront: string | null;
  NomineeNidBack: string | null;
  NomineeCIF: string | null;
}

/** Exact Result payload returned by GET /api/CustomerProfile/ProductDetails. */
export interface AdminekycCustomerProductResponse {
  TrackingNo: number | null;
  ProductTypeId: string | null;
  ProductTypeName: string | null;
  ProductName: string | null;
  Details: Record<string, unknown>;
}

/** Spring DeclineCustomer has no JsonProperty annotations, so keys are lower camel-case. */
export interface AdminekycDeclineCustomerRequest {
  trackingNo: number;
  declineReason: string;
}
