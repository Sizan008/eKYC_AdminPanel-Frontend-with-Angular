export type AdminEkycPage =
  | 'login'
  | 'dashboard'
  | 'productType'
  | 'accountType'
  | 'authorizedCustomers'
  | 'unauthorizedCustomers'
  | 'incompleteCustomers'
  | 'customerDetails';

export type CustomerStatus = 'authorized' | 'unauthorized' | 'incomplete';

export interface CustomerListPageConfig {
  title: string;
  status: CustomerStatus;
}