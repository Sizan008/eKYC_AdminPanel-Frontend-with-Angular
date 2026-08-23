import { environment } from '../../../../../environments/environment';

export const ADMINEKYC_API_BASE_URL =
  environment.adminEkycApiUrl.replace(/\/+$/, '');

/**
 * Spring Boot VerifID Admin endpoints.
 *
 * Keep endpoint paths centralized here. Feature services/pages should never
 * hard-code an `/api/...` path; they should reference this object instead.
 */
export const ADMINEKYC_API_ENDPOINTS = {
  account: {
    loginConfiguration: '/api/Account/Login',
    validate: '/api/Account/Validate',
    validateCentralLogin: '/api/Account/ValidateCentralLogin',
    currentUser: '/api/Account/getUserName',
    signOut: '/api/Account/SignOut',
    activeDirectoryUsers: '/api/Account/ActiveDirectoryUsers',
    createActiveDirectoryUserView: '/api/Account/CreateActiveDirectoryUserView',
    createActiveDirectoryUser: '/api/Account/CreateActiveDirectoryUser',
    updateActiveDirectoryUserView: '/api/Account/UpdateActiveDirectoryUserView',
    updateActiveDirectoryUser: '/api/Account/UpdateActiveDirectoryUser',
    deleteActiveDirectoryUserView: '/api/Account/DeleteActiveDirectoryUserView',
    deleteActiveDirectoryUser: '/api/Account/DeleteActiveDirectoryUser',
    unauthorizedQueue: '/api/Account/ActiveDirectoryUnauthorizedQueue',
    authorizeActiveDirectoryUserView: '/api/Account/AuthorizeActiveDirectoryUserView',
    authorizeActiveDirectoryUser: '/api/Account/AuthorizeActiveDirectoryUser',
    declineActiveDirectoryUserView: '/api/Account/DeclineActiveDirectoryUserView',
    declineActiveDirectoryUser: '/api/Account/DeclineActiveDirectoryUser'
  },

  home: {
    index: '/api/Home/Index',
    privacy: '/api/Home/Privacy',
    error: '/api/Home/Error',
    isSubBranch: '/api/Home/IsSubBranch',
    headOfficeBranchId: '/api/Home/GetHeadOfficeBranchId'
  },

  customerProfile: {
    index: '/api/CustomerProfile/Index',
    search: '/api/CustomerProfile/Search',
    unauthorizedCustomers: '/api/CustomerProfile/UnauthorizedCustomers',
    authorizedCustomers: '/api/CustomerProfile/AuthorizedCustomers',
    pendingBranchCustomers: '/api/CustomerProfile/PendingBranchCustomers',
    declinedCustomers: '/api/CustomerProfile/DeclinedCustomers',
    incompleteCustomers: '/api/CustomerProfile/IncompleteCustomers',
    kycReportByYear: '/api/CustomerProfile/KYCReportByYear',
    details: '/api/CustomerProfile/Details',
    detailsMain: '/api/CustomerProfile/DetailsMain',
    customerDetails: '/api/CustomerProfile/CustomerDetails',
    partnerDetails: '/api/CustomerProfile/PartnerDetails',
    incompleteDetails: '/api/CustomerProfile/IncompleteDetails',
    partialDetails: '/api/CustomerProfile/PartialDetails',
    customerDocument: '/api/CustomerProfile/CustomerDocument',
    nomineeDetails: '/api/CustomerProfile/NomineeDetails',
    guardianDetails: '/api/CustomerProfile/GuardianDetails',
    beneficiaryDetails: '/api/CustomerProfile/BeneficiaryDetails',
    productDetails: '/api/CustomerProfile/ProductDetails',
    sslPaymentDetails: '/api/CustomerProfile/SSLPaymentDetails',
    cashTransactionEnable: '/api/CustomerProfile/CashTransactionEnable',
    photosAndDocs: '/api/CustomerProfile/PhotosAndDocs',
    riskGrading: '/api/CustomerProfile/RiskGrading',
    customerRiskScore: '/api/CustomerProfile/CustomerRiskScore',
    eddQuestions: '/api/CustomerProfile/EDDQuestions',
    saveEddQuestions: '/api/CustomerProfile/SaveEDDQuestions',
    customerEddDetails: '/api/CustomerProfile/CustomerEDDDTLS',
    generateReport: '/api/CustomerProfile/GenerateReport',
    declineAccount: '/api/CustomerProfile/DeclineAccount',
    returnAccount: '/api/CustomerProfile/ReturnAccount',
    loanBoAcceptReason: '/api/CustomerProfile/LoanBOAcceptReason',
    checkedByBranchAdmin: '/api/CustomerProfile/CheckedByBranchAdmin',
    openAccount: '/api/CustomerProfile/OpenAccount',
    withdrawDebitRestriction: '/api/CustomerProfile/WithdrawDrRestriction',
    checkDebitRestriction: '/api/CustomerProfile/CheckDebitRestriction',
    authType: '/api/CustomerProfile/getAuthType',
    updateServices: '/api/CustomerProfile/UpdateServices',
    userLog: '/api/CustomerProfile/UserLog',
    excel: '/api/CustomerProfile/Excel',
    excelDetails: '/api/CustomerProfile/ExcelDetails'
  },

  channel: {
    index: '/api/Channel/Index',
    details: '/api/Channel/Details',
    createView: '/api/Channel/Create',
    create: '/api/Channel/Create',
    edit: '/api/Channel/Edit',
    editById: (id: number | string) => `/api/Channel/Edit/${id}`,
    deleteById: (id: number | string) => `/api/Channel/Delete/${id}`
  },

  product: {
    index: '/api/Product/Index',
    productsOfChannel: '/api/Product/ProductListOfChannel',
    availableProducts: '/api/Product/AddNewProductToChannel',
    assignProduct: '/api/Product/AddProduct',
    list: '/api/Product/ListOfProducts',
    createView: '/api/Product/Create',
    create: '/api/Product/Create',
    deleteFromProductList: '/api/Product/DeleteFromProductList'
  },

  workflow: {
    index: '/api/Workflow/Index',
    sequences: '/api/Workflow/WorkflowSequences',
    createView: '/api/Workflow/Create',
    create: '/api/Workflow/Create',
    editById: (id: number | string) => `/api/Workflow/Edit/${id}`,
    deleteById: (id: number | string) => `/api/Workflow/Delete/${id}`,
    updateSequence: '/api/Workflow/UpdateSequence',
    swapStepSequence: '/api/Workflow/SwapStepSequence'
  },

  parameterConfig: {
    index: '/api/ParameterConfig/Index',
    createView: '/api/ParameterConfig/Create',
    create: '/api/ParameterConfig/Create',
    edit: '/api/ParameterConfig/Edit',
    editById: (id: number | string) =>
      `/api/ParameterConfig/Edit/${encodeURIComponent(String(id))}`
  },

  apiManagement: {
    index: '/api/ApiManagement/Index',
    detailsById: (id: number | string) => `/api/ApiManagement/Details/${id}`,
    createView: '/api/ApiManagement/Create',
    create: '/api/ApiManagement/Create',
    edit: '/api/ApiManagement/Edit',
    editById: (id: number | string) => `/api/ApiManagement/Edit/${id}`,
    deleteById: (id: number | string) => `/api/ApiManagement/Delete/${id}`
  },

  ecVerification: {
    index: '/api/ECVerification/Index',
    divisions: '/api/ECVerification/Divisions',
    districts: '/api/ECVerification/Districts',
    upazilas: '/api/ECVerification/Upazilas',
    postOffices: '/api/ECVerification/PostOffices',
    verify: '/api/ECVerification/ECVerify'
  },

  log: {
    index: '/api/Log/Index',
    list: '/api/Log/LogList',
    search: '/api/Log/Search',
    excel: '/api/Log/Excel'
  },

  report: {
    index: '/api/Report/Index',
    mergedCustomerPhotoAndSignature: '/api/Report/GetMergedCustPhotoAndSignature',
    pdf: '/api/Report/Pdf'
  },

  assistedEkyc: {
    index: '/api/AssistedEkyc/Index',
    detailsById: (id: number | string) => `/api/AssistedEkyc/Details/${id}`,
    createView: '/api/AssistedEkyc/Create',
    create: '/api/AssistedEkyc/Create',
    editById: (id: number | string) => `/api/AssistedEkyc/Edit/${id}`,
    deleteById: (id: number | string) => `/api/AssistedEkyc/Delete/${id}`
  },

  error: {
    fullPage: '/api/Error/FullPage',
    partialPage: '/api/Error/PartialPage'
  },

  /**
   * Temporary json-server endpoints kept only so modules that have not yet
   * been migrated continue to compile during the module-by-module rollout.
   * New Spring Boot integration code must use the grouped endpoints above.
   */
  admins: '/admins',
  customers: '/customers',
  products: '/products',
  accountTypes: '/accountTypes',
  channels: '/channels',
  channelsProduct: '/channelsProduct',
  productManagementProducts: '/productManagementProducts',
  workflowManagementWorkflows: '/workflowManagementWorkflows',
  workflowManagementSteps: '/workflowManagementSteps'
} as const;

export const ADMINEKYC_STORAGE_KEYS = {
  currentAdmin: 'adminekyc_current_admin'
} as const;
