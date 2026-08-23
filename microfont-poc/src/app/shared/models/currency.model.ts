export interface CurrencyModel {
  currencyId: string;         // length: 3
  currencyFullNm: string;     // length: 30
  currencyReportNm?: string;  // optional, length: 30
  isoSwiftCode: string;       // length: 3
  authStatusId: string;       // length: 1
  makeBy: string;             // length: 15
  makeDt: string;               // required
  auth1stBy?: string;         // optional, length: 15
  auth1stDt?: string;           // optional
  lastAction: string;         // length: 3
}


