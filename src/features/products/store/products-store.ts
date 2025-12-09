import { create } from "zustand";
import { productsService } from "../services/products-service";
import { Product, ProductFormData, ProductsState } from "../types";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";

// Helper to get current tenant ID - throws error if not available
const getTenantId = (): string => {
  const tenantId = useTenantsStore.getState().currentTenant?.id;
  if (!tenantId) {
    throw new Error("Tenant ID is required. Please make sure you are logged in.");
  }
  return tenantId;
};

interface ProductsStore extends ProductsState {
  // Hidden products list
  hiddenProducts: string[];
  // Actions
  fetchProducts: (userId: string) => Promise<void>;
  fetchHiddenProducts: (userId: string) => Promise<void>;
  createProduct: (productData: ProductFormData, userId: string) => Promise<void>;
  updateProduct: (productId: string, productData: Partial<ProductFormData>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  hideProduct: (productName: string, userId: string) => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProductsStore = create<ProductsStore>()((set, get) => ({
  // Initial State
  products: [],
  hiddenProducts: [],
  isLoading: false,
  error: null,

  // Actions
  fetchProducts: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const tenantId = getTenantId();
      const products = await productsService.fetchProducts(userId, tenantId);
      set({ products, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createProduct: async (productData: ProductFormData, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const tenantId = getTenantId();
      const id = await productsService.createProduct(productData, userId, tenantId);
      const newProduct: Product = {
        id,
        ...productData,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({
        products: [...state.products, newProduct].sort((a, b) =>
          a.productName.localeCompare(b.productName, "ar")
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateProduct: async (
    productId: string,
    productData: Partial<ProductFormData>
  ) => {
    try {
      set({ isLoading: true, error: null });
      const tenantId = getTenantId();
      await productsService.updateProduct(productId, productData, tenantId);
      set((state) => ({
        products: state.products
          .map((product) =>
            product.id === productId
              ? { ...product, ...productData, updatedAt: new Date() }
              : product
          )
          .sort((a, b) => a.productName.localeCompare(b.productName, "ar")),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteProduct: async (productId: string) => {
    try {
      set({ isLoading: true, error: null });
      const tenantId = getTenantId();
      await productsService.deleteProduct(productId, tenantId);
      set((state) => ({
        products: state.products.filter((product) => product.id !== productId),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  hideProduct: async (productName: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const tenantId = getTenantId();
      await productsService.hideProduct(productName, userId, tenantId);
      set((state) => ({
        hiddenProducts: [...state.hiddenProducts, productName],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchHiddenProducts: async (userId: string) => {
    try {
      const tenantId = getTenantId();
      const hiddenProducts = await productsService.fetchHiddenProducts(userId, tenantId);
      set({ hiddenProducts });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));
