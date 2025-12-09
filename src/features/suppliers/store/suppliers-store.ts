import { create } from "zustand";
import { Supplier, SupplierPayment } from "../types";
import { suppliersService } from "../services/suppliers-service";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";

// Helper to get current tenant ID - throws error if not available
const getTenantId = (): string => {
  const tenantId = useTenantsStore.getState().currentTenant?.id;
  if (!tenantId) {
    throw new Error("Tenant ID is required. Please make sure you are logged in.");
  }
  return tenantId;
};

interface SuppliersState {
  suppliers: Supplier[];
  payments: SupplierPayment[];
  isLoading: boolean;
  error: string | null;
  fetchSuppliers: (userId: string) => Promise<void>;
  createSupplier: (supplierData: Omit<Supplier, "id">) => Promise<string>;
  updateSupplierBalance: (supplierId: string, newBalance: number) => Promise<void>;
  recordPayment: (paymentData: Omit<SupplierPayment, "id" | "paymentDate">) => Promise<void>;
  fetchSupplierPayments: (supplierId: string) => Promise<void>;
  fetchAllPayments: (userId: string) => Promise<void>;
}

export const useSuppliersStore = create<SuppliersState>((set, get) => ({
  suppliers: [],
  payments: [],
  isLoading: false,
  error: null,

  fetchSuppliers: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const suppliers = await suppliersService.fetchSuppliers(userId, tenantId);
      set({ suppliers, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch suppliers",
        isLoading: false,
      });
    }
  },

  createSupplier: async (supplierData: Omit<Supplier, "id">) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const supplierId = await suppliersService.createSupplier(supplierData, tenantId);
      // Refresh suppliers list
      await get().fetchSuppliers(supplierData.userId);
      set({ isLoading: false });
      return supplierId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create supplier",
        isLoading: false,
      });
      throw error;
    }
  },

  updateSupplierBalance: async (supplierId: string, newBalance: number) => {
    try {
      const tenantId = getTenantId();
      await suppliersService.updateSupplierBalance(supplierId, newBalance, tenantId);
      // Update local state
      set((state) => ({
        suppliers: state.suppliers.map((s) =>
          s.id === supplierId ? { ...s, totalBalance: newBalance } : s
        ),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update supplier balance",
      });
      throw error;
    }
  },

  recordPayment: async (paymentData: Omit<SupplierPayment, "id" | "paymentDate">) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      // Add paymentDate automatically
      const paymentWithDate = {
        ...paymentData,
        paymentDate: new Date(),
      };
      await suppliersService.recordPayment(paymentWithDate, tenantId);
      // Update supplier balance
      await get().updateSupplierBalance(
        paymentData.supplierId,
        paymentData.currentBalance
      );
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to record payment",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchSupplierPayments: async (supplierId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const payments = await suppliersService.fetchSupplierPayments(supplierId, tenantId);
      set({ payments, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch payments",
        isLoading: false,
      });
    }
  },

  fetchAllPayments: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const payments = await suppliersService.fetchAllPayments(userId, tenantId);
      set({ payments, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch payments",
        isLoading: false,
      });
    }
  },
}));
