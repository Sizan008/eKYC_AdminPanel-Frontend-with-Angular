export interface AdminProduct {
  id: number;
  name: string;
  status: 'active' | 'inactive' | string;
}

export interface AdminAccountType {
  id: number;
  productType: string;
  name: string;
  status: 'active' | 'inactive' | string;
}