export interface FileMetadata {
  fileName: string;
  mimeType?: string;
  url?: string;
  fileSize?: number; // bytes
}

export interface Stock {
  id: number;
  productId?: string;
  productName?: string;
  brand?: string;
  category?: string;
  quantity: number;
  pricePerItem: number;
  totalValue?: number;
  expiryDate?: string | null; // ISO date string
  manufactureMonthYear?: string; // e.g. "08/2024"
  arrivalTime?: string | null; // ISO datetime or time string
  warehouseAddress?: string;
  warehouseOffice?: string;
  tags?: string[];
  description?: string;
  notes?: string;
  active?: boolean;
  attachments?: FileMetadata[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockCreateDTO extends Omit<Stock, 'id' | 'createdAt' | 'updatedAt'> {}

export interface StockUpdateDTO extends Partial<StockCreateDTO> {
  id: number;
}

export interface StockResponse {
  data: Stock;
}

export interface PaginatedStockResponse {
  data: Stock[];
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface Warehouse {
  id?: string;
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface WarehouseSearchResponse {
  items: Warehouse[];
  total?: number;
}