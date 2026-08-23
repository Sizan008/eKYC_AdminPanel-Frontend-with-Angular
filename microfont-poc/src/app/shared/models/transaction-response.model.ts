/**
 * Transaction Response Model based on TrsIdTransResponse Java class
 * Contains transaction details, foreign currency fields, GL/IBT info, and bill information
 */
export interface TrsIdTransResponse {
  // Transaction fields
  accountNo: string;
  accountTitle: string;
  amountCcy: string;
  amountLcy: string;
  currencyId: string;
  currShNm: string;
  drCr: string;
  exchangeRate: string;

  // Foreign currency fields
  foreignCurrAmt: string;
  foreignCurrId: string;
  foreignCurrRate: string;
  foreignCurrRateId: string;
  foreignNostroAccNo: string;

  // GL and IBT fields
  glAccSl: string;
  ibtCode: string;
  ibtNm: string;
  narration: string;

  // Nostro and branch fields
  nostroAcSlNo: string;
  orgnBr: string;
  orgnBrId: string;
  orgnDate: string;
  originalBatchNo: string;
  originalTracerNo: string;
  rspdBrId: string;
  slNo: string;
  adviceNo: string;
  refNo: string;
  exchRateId: string;
  msgRefNo: string;

  // Bill info fields (from GetBillInfoByLCNo)
  lcBranchId: string;
  lcYear: string;
  lcPrdType: string;
  lcSerial: string;
  intermediaryBankBic56: string;
  nameAddress56: string;
  accountNo56: string;
  crpdentBeneficiaryBic57: string;
  nameAddress57: string;
  accountNo57: string;
  beneficiaryBankBic58: string;
  nameAddress58: string;
  accountNo58: string;
  narrative: string;
}

/**
 * Simplified transaction data for table display
 * Contains the required columns for the transaction table
 */
export interface TransactionTableData {
  // Core transaction identification
  orgnDate: string;           // Origin Date
  orgnBranch: string;         // Origin Branch
  adviceNo: string;           // Advice Number
  narration: string;          // Transaction description

  // Transaction details
  ibtCode?: string;            // Inter-Branch Transfer code
  drCr: string;              // Debit/Credit indicator ('C' or 'D')
  amountCcy: string;         // Transaction Amount in Currency
  amountLcy: string;         // Transaction Amount in Local Currency
  currencyId: string;        // Currency code
  exchangeRate: string;      // Exchange Rate
  nostroAccount: string;     // Nostro Account details
  msgRefNo?: string;
  accountNo: string;
  accountTitle: string;
  currShNm: string;
  // Optional fields for reference
  originalData?: any;        // Original full transaction data
}
