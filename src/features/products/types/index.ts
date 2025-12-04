export interface Product {
  id: string;
  productName: string;
  unitSellingPrice: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface ProductFormData {
  productName: string;
  unitSellingPrice: number;
}

export interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}
