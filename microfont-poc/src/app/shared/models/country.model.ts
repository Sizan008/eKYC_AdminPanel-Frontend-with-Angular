export interface CountryModel {
  countryId: string;
  countryNm: string;
  countryShNm?: string;
  currencyId?: string;
  homeCountryFlag: boolean;
  authStatusId: string;
  makeBy: string;
  makeDt: string;
  auth1stBy?: string;
  auth1stDt?: string;
  lastAction: string;
  isoCode?: string;
}
