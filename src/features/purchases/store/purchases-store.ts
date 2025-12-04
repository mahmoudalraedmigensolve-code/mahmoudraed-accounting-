// Purchases Zustand Store
import { create } from "zustand";
import { purchasesService } from "../services/purchases-service";
import { Purchase, PurchaseFormData, PurchasesState } from "../types";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";

// Helper to get current tenant ID
const getTenantId = () => useTenantsStore.getState().currentTenant?.id;

interface PurchasesStore extends PurchasesState {
  // Actions
  fetchPurchases: (userId: string) => Promise<void>;
  createPurchase: (purchaseData: PurchaseFormData, userId: string) => Promise<void>;
  updatePurchase: (purchaseId: string, purchaseData: Partial<PurchaseFormData>) => Promise<void>;
  deletePurchase: (purchaseId: string) => Promise<void>;
  deleteSupplier: (userId: string, supplierName: string) => Promise<void>;
  updateSellingPriceByProductName: (userId: string, productName: string, newUnitSellingPrice: number) => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePurchasesStore = create<PurchasesStore>()((set, get) => ({
  // Initial State
  purchases: [],
  isLoading: false,
  error: null,

  // Actions
  fetchPurchases: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const tenantId = getTenantId();
      const purchases = await purchasesService.fetchPurchases(userId, tenantId);
      set({ purchases, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createPurchase: async (purchaseData: PurchaseFormData, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const tenantId = getTenantId();
      await purchasesService.createPurchase(purchaseData, userId, tenantId);
      // Refresh purchases list
      await get().fetchPurchases(userId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updatePurchase: async (
    purchaseId: string,
    purchaseData: Partial<PurchaseFormData>
  ) => {
    try {
      set({ isLoading: true, error: null });
      const tenantId = getTenantId();
      await purchasesService.updatePurchase(purchaseId, purchaseData, tenantId);

      // Update local state
      const purchases = get().purchases.map((p) =>
        p.id === purchaseId
          ? { ...p, ...purchaseData, updatedAt: new Date() }
          : p
      );
      set({ purchases, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deletePurchase: async (purchaseId: string) => {
    try {
      set({ isLoading: true, error: null });
      const tenantId = getTenantId();
      await purchasesService.deletePurchase(purchaseId, tenantId);

      // Remove from local state
      const purchases = get().purchases.filter((p) => p.id !== purchaseId);
      set({ purchases, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteSupplier: async (userId: string, supplierName: string) => {
    try {
      set({ isLoading: true, error: null });
      const tenantId = getTenantId();
      await purchasesService.deleteSupplier(userId, supplierName, tenantId);

      // Remove all purchases with this supplier from local state
      const purchases = get().purchases.filter((p) => p.supplierName !== supplierName);
      set({ purchases, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateSellingPriceByProductName: async (
    userId: string,
    productName: string,
    newUnitSellingPrice: number
  ) => {
    try {
      set({ isLoading: true, error: null });
      const tenantId = getTenantId();
      await purchasesService.updateSellingPriceByProductName(
        userId,
        productName,
        newUnitSellingPrice,
        tenantId
      );
      // Refresh purchases list
      await get().fetchPurchases(userId);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
