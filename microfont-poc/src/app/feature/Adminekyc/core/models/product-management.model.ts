export type ProductFormValue = string | number | null | undefined;

export interface ProductManagementChannel {
  id: number;
  channelName: string;
}

export interface ProductManagementChannelProduct {
  id: number;
  productCode: number;
  productName: string;
}

export interface AdminProductManagementProduct {
  id: number;
  productCode: number;
  productId: string;
  productName: string;
  productDescription: string;
}

export interface ProductManagementAvailableProduct {
  id: number;
  productCode: number;
  productName: string;
  productDescription: string;
}

export interface ProductManagementAvailableProducts {
  channelId: number;
  channelName: string;
  products: ProductManagementAvailableProduct[];
}

export interface ProductCreateForm {
  productId: ProductFormValue;
  productType: ProductFormValue;
  serviceTypeId: ProductFormValue;
  productName: ProductFormValue;
  productDescription: ProductFormValue;
  amountMax: ProductFormValue;
  amountMin: ProductFormValue;
  gender: ProductFormValue;
  profession: ProductFormValue;
  ageMax: ProductFormValue;
  ageMin: ProductFormValue;
}

export interface ProductAssignForm {
  availableProduct: string;
}
