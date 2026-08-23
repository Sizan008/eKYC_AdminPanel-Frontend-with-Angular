/** Exact Spring JSON contract used by the Product module. */
export interface AdminekycProductChannelResponse {
  ChannelId: number | null;
  ChannelName: string | null;
}

export interface AdminekycChannelProductResponse {
  ProductCode: number | null;
  ProductName: string | null;
}

export interface AdminekycAvailableProductResponse {
  ProductCode: number | null;
  ProductName: string | null;
  ProductDesc: string | null;
}

export interface AdminekycAvailableProductsResponse {
  ChannelId: number | null;
  ChannelName: string | null;
  Products: AdminekycAvailableProductResponse[] | null;
}

export interface AdminekycProductResponse {
  ProductCode: number | null;
  ProductId: string | null;
  ProductName: string | null;
  ProductDesc: string | null;
}

/** GET /api/Product/Create returns the same command shape with backend defaults. */
export interface AdminekycCreateProductDefaultsResponse {
  ApplicationId: number | null;
  ProductId: string | null;
  ServiceTypeId: string | null;
  ProductName: string | null;
  ProductDesc: string | null;
  ProductType: string | null;
  AmountMax: number | null;
  AmountMin: number | null;
  Gender: string | null;
  Profession: string | null;
  AgeMax: number | null;
  AgeMin: number | null;
}

export interface AdminekycCreateProductRequest {
  ApplicationId: number;
  ProductId: string;
  ServiceTypeId: string;
  ProductName: string;
  ProductDesc: string | null;
  ProductType: string;
  AmountMax: number;
  AmountMin: number;
  Gender: string | null;
  Profession: string | null;
  AgeMax: number;
  AgeMin: number;
}

export interface AdminekycAssignProductRequest {
  ProductCode: number;
  ChannelID: number;
}
