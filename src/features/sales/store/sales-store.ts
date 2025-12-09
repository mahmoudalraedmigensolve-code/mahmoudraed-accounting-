// Sales Zustand Store - No persistence to ensure fresh data across devices
import { create } from "zustand";
import { Sale, Customer, SaleFormData, SalesState, CustomerReceipt } from "../types";
import {
  salesService,
  customersService,
  receiptsService,
} from "../services/sales-service";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";

// Helper to get current tenant ID - throws error if not available
const getTenantId = (): string => {
  const tenantId = useTenantsStore.getState().currentTenant?.id;
  if (!tenantId) {
    throw new Error("Tenant ID is required. Please make sure you are logged in.");
  }
  return tenantId;
};

interface SalesStore extends SalesState {
  // Sales Actions
  fetchSales: (userId: string) => Promise<void>;
  createSale: (saleData: SaleFormData, userId: string) => Promise<void>;
  updateSale: (saleId: string, saleData: Partial<SaleFormData>) => Promise<void>;
  deleteSale: (saleId: string) => Promise<void>;

  // Customers Actions
  fetchCustomers: (userId: string) => Promise<void>;
  getCustomerByNameAndPhone: (
    name: string,
    phone: string,
    userId: string
  ) => Promise<Customer | null>;
  updateCustomerBalance: (customerId: string, newBalance: number) => Promise<void>;
  addPaymentToCustomer: (customerId: string, paymentAmount: number) => Promise<void>;
  deleteCustomer: (customerId: string, userId: string) => Promise<void>;

  // Receipts Actions
  fetchCustomerReceipts: (customerId: string) => Promise<void>;
  fetchAllReceipts: (userId: string) => Promise<void>;
  createReceipt: (receiptData: Omit<CustomerReceipt, "id" | "createdAt" | "updatedAt">, userId: string) => Promise<void>;
  updateReceipt: (receiptId: string, receiptData: Partial<Omit<CustomerReceipt, "id" | "createdAt" | "updatedAt">>) => Promise<void>;
  deleteReceipt: (receiptId: string, customerId: string, userId: string) => Promise<void>;
  generateReceiptNumber: (userId: string) => Promise<string>;

  // Utility
  clearError: () => void;
}

export const useSalesStore = create<SalesStore>()((set, get) => ({
  // Initial State
  sales: [],
  customers: [],
  receipts: [],
  isLoading: false,
  error: null,

  // ============= Sales Actions =============

  fetchSales: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const sales = await salesService.fetchSales(userId, tenantId);
      set({ sales, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createSale: async (saleData: SaleFormData, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      let customerId = saleData.customerId;

      if (!customerId) {
        const existingCustomer = await customersService.getCustomerByNameAndPhone(
          saleData.customerName,
          saleData.customerPhone,
          userId,
          tenantId
        );

        if (existingCustomer) {
          customerId = existingCustomer.id;
          await customersService.updateCustomerBalance(
            customerId,
            saleData.currentBalance,
            tenantId
          );
        } else {
          customerId = await customersService.upsertCustomer(
            {
              name: saleData.customerName,
              phone: saleData.customerPhone,
              totalBalance: saleData.currentBalance,
            },
            userId,
            undefined,
            tenantId
          );
        }
      } else {
        await customersService.updateCustomerBalance(
          customerId,
          saleData.currentBalance,
          tenantId
        );
      }

      await salesService.createSale(
        { ...saleData, customerId },
        userId,
        tenantId
      );

      await Promise.all([
        get().fetchSales(userId),
        get().fetchCustomers(userId),
      ]);

      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateSale: async (saleId: string, saleData: Partial<SaleFormData>) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      await salesService.updateSale(saleId, saleData, tenantId);

      const sales = get().sales.map((sale) =>
        sale.id === saleId ? { ...sale, ...saleData } : sale
      );
      set({ sales, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteSale: async (saleId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const sale = get().sales.find((s) => s.id === saleId);

      if (sale && sale.customerId) {
        const customer = get().customers.find((c) => c.id === sale.customerId);

        if (customer) {
          const newBalance = customer.totalBalance - sale.currentBalance;
          await customersService.updateCustomerBalance(sale.customerId, newBalance, tenantId);

          const customers = get().customers.map((c) =>
            c.id === sale.customerId
              ? { ...c, totalBalance: newBalance }
              : c
          );
          set({ customers });
        }
      }

      await salesService.deleteSale(saleId, tenantId);

      const sales = get().sales.filter((s) => s.id !== saleId);
      set({ sales, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ============= Customers Actions =============

  fetchCustomers: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const customers = await customersService.fetchCustomers(userId, tenantId);
      set({ customers, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getCustomerByNameAndPhone: async (
    name: string,
    phone: string,
    userId: string
  ) => {
    try {
      const tenantId = getTenantId();
      return await customersService.getCustomerByNameAndPhone(
        name,
        phone,
        userId,
        tenantId
      );
    } catch (error: any) {
      console.error("Error getting customer:", error);
      return null;
    }
  },

  updateCustomerBalance: async (customerId: string, newBalance: number) => {
    try {
      const tenantId = getTenantId();
      await customersService.updateCustomerBalance(customerId, newBalance, tenantId);

      const customers = get().customers.map((customer) =>
        customer.id === customerId
          ? { ...customer, totalBalance: newBalance }
          : customer
      );
      set({ customers });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  addPaymentToCustomer: async (customerId: string, paymentAmount: number) => {
    try {
      const tenantId = getTenantId();
      const customer = get().customers.find((c) => c.id === customerId);
      if (!customer) {
        throw new Error("العميل غير موجود");
      }

      const customerSales = get().sales.filter((s) => s.customerId === customerId);
      let nextInvoiceNumber = "1";

      if (customerSales.length > 0) {
        const sortedSales = [...customerSales].sort((a, b) => {
          const numA = parseInt(a.invoiceNumber) || 0;
          const numB = parseInt(b.invoiceNumber) || 0;
          return numB - numA;
        });

        const lastInvoiceNum = parseInt(sortedSales[0].invoiceNumber) || 0;
        nextInvoiceNumber = (lastInvoiceNum + 1).toString();
      }

      const paymentInvoice = {
        invoiceNumber: nextInvoiceNumber,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        invoiceType: "payment" as const,
        items: [],
        totalAmount: -paymentAmount,
        paidAmount: paymentAmount,
        deferredAmount: 0,
        previousBalance: customer.totalBalance,
        currentBalance: customer.totalBalance - paymentAmount,
      };

      const userId = customer.userId;

      await salesService.createSale(paymentInvoice, userId, tenantId);

      const newBalance = customer.totalBalance - paymentAmount;
      await customersService.updateCustomerBalance(customerId, newBalance, tenantId);

      const updatedSales = await salesService.fetchSales(userId, tenantId);

      const customers = get().customers.map((c) =>
        c.id === customerId ? { ...c, totalBalance: newBalance } : c
      );
      set({ customers, sales: updatedSales });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteCustomer: async (customerId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const customerSales = get().sales.filter((s) => s.customerId === customerId);

      for (const sale of customerSales) {
        await salesService.deleteSale(sale.id, tenantId);
      }

      await customersService.deleteCustomer(customerId, tenantId);

      const customers = get().customers.filter((c) => c.id !== customerId);
      const sales = get().sales.filter((s) => s.customerId !== customerId);

      set({ customers, sales, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // ============= Receipts Actions =============

  fetchCustomerReceipts: async (customerId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const receipts = await receiptsService.fetchCustomerReceipts(customerId, tenantId);
      set({ receipts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchAllReceipts: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const receipts = await receiptsService.fetchAllReceipts(userId, tenantId);
      set({ receipts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createReceipt: async (
    receiptData: Omit<CustomerReceipt, "id" | "createdAt" | "updatedAt">,
    userId: string
  ) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      await receiptsService.createReceipt(receiptData, tenantId);

      await customersService.updateCustomerBalance(
        receiptData.customerId,
        receiptData.currentBalance,
        tenantId
      );

      await Promise.all([
        get().fetchCustomerReceipts(receiptData.customerId),
        get().fetchCustomers(userId),
      ]);

      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateReceipt: async (
    receiptId: string,
    receiptData: Partial<Omit<CustomerReceipt, "id" | "createdAt" | "updatedAt">>
  ) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      await receiptsService.updateReceipt(receiptId, receiptData, tenantId);

      const receipts = get().receipts.map((receipt) =>
        receipt.id === receiptId ? { ...receipt, ...receiptData } : receipt
      );
      set({ receipts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteReceipt: async (receiptId: string, customerId: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const receipt = get().receipts.find((r) => r.id === receiptId);

      if (receipt) {
        const customer = get().customers.find((c) => c.id === customerId);

        if (customer) {
          const newBalance = customer.totalBalance + receipt.paidAmount;
          await customersService.updateCustomerBalance(customerId, newBalance, tenantId);

          const customers = get().customers.map((c) =>
            c.id === customerId ? { ...c, totalBalance: newBalance } : c
          );
          set({ customers });
        }
      }

      await receiptsService.deleteReceipt(receiptId, tenantId);

      const receipts = get().receipts.filter((r) => r.id !== receiptId);
      set({ receipts, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  generateReceiptNumber: async (userId: string) => {
    try {
      const tenantId = getTenantId();
      return await receiptsService.generateReceiptNumber(userId, tenantId);
    } catch (error: any) {
      console.error("Error generating receipt number:", error);
      return `REC-${Date.now()}`;
    }
  },

  // ============= Utility =============

  clearError: () => set({ error: null }),
}));
