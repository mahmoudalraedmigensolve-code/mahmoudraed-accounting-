// Sales Zustand Store
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Sale, Customer, SaleFormData, SalesState, CustomerReceipt } from "../types";
import {
  salesService,
  customersService,
  receiptsService,
} from "../services/sales-service";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";

// Helper to get current tenant ID
const getTenantId = () => useTenantsStore.getState().currentTenant?.id;

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

export const useSalesStore = create<SalesStore>()(
  persist(
    (set, get) => ({
      // Initial State
      sales: [],
      customers: [],
      receipts: [],
      isLoading: false,
      error: null,

      // ============= Sales Actions =============

      /**
       * Fetch all sales for a user
       */
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

      /**
       * Create a new sale
       */
      createSale: async (saleData: SaleFormData, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const tenantId = getTenantId();
          // 1. Create or update customer
          let customerId = saleData.customerId;

          if (!customerId) {
            // Check if customer exists
            const existingCustomer = await customersService.getCustomerByNameAndPhone(
              saleData.customerName,
              saleData.customerPhone,
              userId,
              tenantId
            );

            if (existingCustomer) {
              customerId = existingCustomer.id;
              // Update existing customer balance
              await customersService.updateCustomerBalance(
                customerId,
                saleData.currentBalance,
                tenantId
              );
            } else {
              // Create new customer
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
            // Update existing customer balance
            await customersService.updateCustomerBalance(
              customerId,
              saleData.currentBalance,
              tenantId
            );
          }

          // 2. Create sale with customerId
          const saleId = await salesService.createSale(
            { ...saleData, customerId },
            userId,
            tenantId
          );

          // 3. Refresh sales and customers
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

      /**
       * Update an existing sale
       */
      updateSale: async (saleId: string, saleData: Partial<SaleFormData>) => {
        set({ isLoading: true, error: null });
        try {
          const tenantId = getTenantId();
          await salesService.updateSale(saleId, saleData, tenantId);

          // Update local state
          const sales = get().sales.map((sale) =>
            sale.id === saleId ? { ...sale, ...saleData } : sale
          );
          set({ sales, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      /**
       * Delete a sale
       */
      deleteSale: async (saleId: string) => {
        set({ isLoading: true, error: null });
        try {
          const tenantId = getTenantId();
          // Find the sale to get customer info before deleting
          const sale = get().sales.find((s) => s.id === saleId);

          if (sale && sale.customerId) {
            // Find the customer
            const customer = get().customers.find((c) => c.id === sale.customerId);

            if (customer) {
              // Reduce customer balance by the current balance from this sale
              const newBalance = customer.totalBalance - sale.currentBalance;
              await customersService.updateCustomerBalance(sale.customerId, newBalance, tenantId);

              // Update customers in local state
              const customers = get().customers.map((c) =>
                c.id === sale.customerId
                  ? { ...c, totalBalance: newBalance }
                  : c
              );
              set({ customers });
            }
          }

          // Delete the sale from Firebase
          await salesService.deleteSale(saleId, tenantId);

          // Update local state
          const sales = get().sales.filter((s) => s.id !== saleId);
          set({ sales, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // ============= Customers Actions =============

      /**
       * Fetch all customers for a user
       */
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

      /**
       * Get customer by name and phone
       */
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

      /**
       * Update customer balance
       */
      updateCustomerBalance: async (customerId: string, newBalance: number) => {
        try {
          const tenantId = getTenantId();
          await customersService.updateCustomerBalance(customerId, newBalance, tenantId);

          // Update local state
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

      /**
       * Add payment to customer (reduce their balance and create payment invoice)
       */
      addPaymentToCustomer: async (customerId: string, paymentAmount: number) => {
        try {
          const tenantId = getTenantId();
          const customer = get().customers.find((c) => c.id === customerId);
          if (!customer) {
            throw new Error("العميل غير موجود");
          }

          // Get customer's last invoice number to generate next one
          const customerSales = get().sales.filter((s) => s.customerId === customerId);
          let nextInvoiceNumber = "1";

          if (customerSales.length > 0) {
            // Sort by invoice number and get the last one
            const sortedSales = [...customerSales].sort((a, b) => {
              const numA = parseInt(a.invoiceNumber) || 0;
              const numB = parseInt(b.invoiceNumber) || 0;
              return numB - numA;
            });

            const lastInvoiceNum = parseInt(sortedSales[0].invoiceNumber) || 0;
            nextInvoiceNumber = (lastInvoiceNum + 1).toString();
          }

          // Create payment invoice
          const paymentInvoice = {
            invoiceNumber: nextInvoiceNumber,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            invoiceType: "payment" as const,
            items: [], // No items for payment invoice
            totalAmount: -paymentAmount, // Negative to indicate payment
            paidAmount: paymentAmount,
            deferredAmount: 0,
            previousBalance: customer.totalBalance,
            currentBalance: customer.totalBalance - paymentAmount,
          };

          // Get user from auth (we need userId)
          const userId = customer.userId;

          // Create the payment invoice in Firebase
          await salesService.createSale(paymentInvoice, userId, tenantId);

          // Update customer balance
          const newBalance = customer.totalBalance - paymentAmount;
          await customersService.updateCustomerBalance(customerId, newBalance, tenantId);

          // Refresh sales to get the new invoice
          const updatedSales = await salesService.fetchSales(userId, tenantId);

          // Update local state
          const customers = get().customers.map((c) =>
            c.id === customerId ? { ...c, totalBalance: newBalance } : c
          );
          set({ customers, sales: updatedSales });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      /**
       * Delete a customer and all their invoices
       */
      deleteCustomer: async (customerId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const tenantId = getTenantId();
          // Find all sales for this customer
          const customerSales = get().sales.filter((s) => s.customerId === customerId);

          // Delete all customer invoices first
          for (const sale of customerSales) {
            await salesService.deleteSale(sale.id, tenantId);
          }

          // Delete the customer from Firebase
          await customersService.deleteCustomer(customerId, tenantId);

          // Update local state - remove customer and their sales
          const customers = get().customers.filter((c) => c.id !== customerId);
          const sales = get().sales.filter((s) => s.customerId !== customerId);

          set({ customers, sales, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // ============= Receipts Actions =============

      /**
       * Fetch all receipts for a specific customer
       */
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

      /**
       * Fetch all receipts for a user
       */
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

      /**
       * Create a new customer receipt
       */
      createReceipt: async (
        receiptData: Omit<CustomerReceipt, "id" | "createdAt" | "updatedAt">,
        userId: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const tenantId = getTenantId();
          // 1. Create the receipt
          await receiptsService.createReceipt(receiptData, tenantId);

          // 2. Update customer balance (reduce by payment amount)
          await customersService.updateCustomerBalance(
            receiptData.customerId,
            receiptData.currentBalance,
            tenantId
          );

          // 3. Refresh receipts and customers
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

      /**
       * Update an existing receipt
       */
      updateReceipt: async (
        receiptId: string,
        receiptData: Partial<Omit<CustomerReceipt, "id" | "createdAt" | "updatedAt">>
      ) => {
        set({ isLoading: true, error: null });
        try {
          const tenantId = getTenantId();
          await receiptsService.updateReceipt(receiptId, receiptData, tenantId);

          // Update local state
          const receipts = get().receipts.map((receipt) =>
            receipt.id === receiptId ? { ...receipt, ...receiptData } : receipt
          );
          set({ receipts, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      /**
       * Delete a receipt and restore customer balance
       */
      deleteReceipt: async (receiptId: string, customerId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const tenantId = getTenantId();
          // Find the receipt to get payment amount
          const receipt = get().receipts.find((r) => r.id === receiptId);

          if (receipt) {
            // Find the customer
            const customer = get().customers.find((c) => c.id === customerId);

            if (customer) {
              // Restore customer balance by adding back the payment amount
              const newBalance = customer.totalBalance + receipt.paidAmount;
              await customersService.updateCustomerBalance(customerId, newBalance, tenantId);

              // Update customers in local state
              const customers = get().customers.map((c) =>
                c.id === customerId ? { ...c, totalBalance: newBalance } : c
              );
              set({ customers });
            }
          }

          // Delete the receipt from Firebase
          await receiptsService.deleteReceipt(receiptId, tenantId);

          // Update local state - remove receipt
          const receipts = get().receipts.filter((r) => r.id !== receiptId);
          set({ receipts, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      /**
       * Generate unique receipt number
       */
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
    }),
    {
      name: "sales-store",
      partialize: (state) => ({
        sales: state.sales,
        customers: state.customers,
        receipts: state.receipts,
      }),
    }
  )
);
