// Sales Firebase Service
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Sale, SaleFormData, Customer, CustomerReceipt } from "../types";

// Helper functions for collection paths
const getSalesPath = (tenantId?: string) =>
  tenantId ? `tenants/${tenantId}/sales` : "sales";
const getCustomersPath = (tenantId?: string) =>
  tenantId ? `tenants/${tenantId}/customers` : "customers";
const getReceiptsPath = (tenantId?: string) =>
  tenantId ? `tenants/${tenantId}/customer_receipts` : "customer_receipts";

// ============= Sales Operations =============

export const salesService = {
  /**
   * Create a new sale/invoice
   */
  async createSale(
    saleData: SaleFormData,
    userId: string,
    tenantId?: string
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      const collectionPath = getSalesPath(tenantId);

      const docData = {
        ...saleData,
        userId,
        tenantId: tenantId || null,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, collectionPath), docData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating sale:", error);
      throw new Error("فشل في إنشاء الفاتورة");
    }
  },

  /**
   * Fetch all sales for a specific user
   */
  async fetchSales(userId: string, tenantId?: string): Promise<Sale[]> {
    try {
      const collectionPath = getSalesPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Sale;
      });
    } catch (error) {
      console.error("Error fetching sales:", error);
      throw new Error("فشل في جلب المبيعات");
    }
  },

  /**
   * Update an existing sale
   */
  async updateSale(
    saleId: string,
    saleData: Partial<SaleFormData>,
    tenantId?: string
  ): Promise<void> {
    try {
      const collectionPath = getSalesPath(tenantId);
      const saleRef = doc(db, collectionPath, saleId);
      await updateDoc(saleRef, {
        ...saleData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating sale:", error);
      throw new Error("فشل في تحديث الفاتورة");
    }
  },

  /**
   * Delete a sale
   */
  async deleteSale(saleId: string, tenantId?: string): Promise<void> {
    try {
      const collectionPath = getSalesPath(tenantId);
      const saleRef = doc(db, collectionPath, saleId);
      await deleteDoc(saleRef);
    } catch (error) {
      console.error("Error deleting sale:", error);
      throw new Error("فشل في حذف الفاتورة");
    }
  },
};

// ============= Customer Operations =============

export const customersService = {
  /**
   * Create or update a customer
   */
  async upsertCustomer(
    customerData: {
      name: string;
      phone: string;
      totalBalance: number;
    },
    userId: string,
    customerId?: string,
    tenantId?: string
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      const collectionPath = getCustomersPath(tenantId);

      // If customerId is provided, update existing customer
      if (customerId) {
        const customerRef = doc(db, collectionPath, customerId);
        await updateDoc(customerRef, {
          ...customerData,
          updatedAt: now,
        });
        return customerId;
      }

      // Otherwise, create new customer
      const docData = {
        ...customerData,
        userId,
        tenantId: tenantId || null,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, collectionPath), docData);
      return docRef.id;
    } catch (error) {
      console.error("Error upserting customer:", error);
      throw new Error("فشل في حفظ بيانات العميل");
    }
  },

  /**
   * Fetch all customers for a specific user
   */
  async fetchCustomers(userId: string, tenantId?: string): Promise<Customer[]> {
    try {
      const collectionPath = getCustomersPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        where("userId", "==", userId),
        orderBy("name", "asc")
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Customer;
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw new Error("فشل في جلب العملاء");
    }
  },

  /**
   * Get customer by name and phone
   */
  async getCustomerByNameAndPhone(
    name: string,
    phone: string,
    userId: string,
    tenantId?: string
  ): Promise<Customer | null> {
    try {
      const collectionPath = getCustomersPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        where("userId", "==", userId),
        where("name", "==", name),
        where("phone", "==", phone)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();

      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Customer;
    } catch (error) {
      console.error("Error getting customer:", error);
      return null;
    }
  },

  /**
   * Update customer balance
   */
  async updateCustomerBalance(
    customerId: string,
    newBalance: number,
    tenantId?: string
  ): Promise<void> {
    try {
      const collectionPath = getCustomersPath(tenantId);
      const customerRef = doc(db, collectionPath, customerId);
      await updateDoc(customerRef, {
        totalBalance: newBalance,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating customer balance:", error);
      throw new Error("فشل في تحديث رصيد العميل");
    }
  },

  /**
   * Delete a customer
   */
  async deleteCustomer(customerId: string, tenantId?: string): Promise<void> {
    try {
      const collectionPath = getCustomersPath(tenantId);
      const customerRef = doc(db, collectionPath, customerId);
      await deleteDoc(customerRef);
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw new Error("فشل في حذف العميل");
    }
  },
};

// ============= Customer Receipts Operations =============

export const receiptsService = {
  /**
   * Generate unique receipt number
   */
  async generateReceiptNumber(userId: string, tenantId?: string): Promise<string> {
    try {
      const collectionPath = getReceiptsPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const lastReceipt = querySnapshot.docs[0];

      if (!lastReceipt) {
        return "REC-001";
      }

      const lastNumber = lastReceipt.data().receiptNumber;
      const numberPart = parseInt(lastNumber.split("-")[1]) + 1;
      return `REC-${numberPart.toString().padStart(3, "0")}`;
    } catch (error) {
      console.error("Error generating receipt number:", error);
      return `REC-${Date.now()}`;
    }
  },

  /**
   * Create a new customer receipt
   */
  async createReceipt(
    receiptData: Omit<CustomerReceipt, "id" | "createdAt" | "updatedAt">,
    tenantId?: string
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      const collectionPath = getReceiptsPath(tenantId);

      const docData = {
        ...receiptData,
        tenantId: tenantId || null,
        receiptDate: Timestamp.fromDate(receiptData.receiptDate),
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(collection(db, collectionPath), docData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating receipt:", error);
      throw new Error("فشل في إنشاء إيصال الاستلام");
    }
  },

  /**
   * Fetch all receipts for a specific customer
   */
  async fetchCustomerReceipts(
    customerId: string,
    tenantId?: string
  ): Promise<CustomerReceipt[]> {
    try {
      const collectionPath = getReceiptsPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        where("customerId", "==", customerId),
        orderBy("receiptDate", "desc")
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          receiptDate: data.receiptDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as CustomerReceipt;
      });
    } catch (error) {
      console.error("Error fetching customer receipts:", error);
      throw new Error("فشل في جلب إيصالات العميل");
    }
  },

  /**
   * Fetch all receipts for a specific user
   */
  async fetchAllReceipts(userId: string, tenantId?: string): Promise<CustomerReceipt[]> {
    try {
      const collectionPath = getReceiptsPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        where("userId", "==", userId),
        orderBy("receiptDate", "desc")
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          receiptDate: data.receiptDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as CustomerReceipt;
      });
    } catch (error) {
      console.error("Error fetching receipts:", error);
      throw new Error("فشل في جلب الإيصالات");
    }
  },

  /**
   * Update an existing receipt
   */
  async updateReceipt(
    receiptId: string,
    receiptData: Partial<Omit<CustomerReceipt, "id" | "createdAt" | "updatedAt">>,
    tenantId?: string
  ): Promise<void> {
    try {
      const collectionPath = getReceiptsPath(tenantId);
      const receiptRef = doc(db, collectionPath, receiptId);
      const updateData: Record<string, unknown> = {
        ...receiptData,
        updatedAt: Timestamp.now(),
      };

      if (receiptData.receiptDate) {
        updateData.receiptDate = Timestamp.fromDate(receiptData.receiptDate);
      }

      await updateDoc(receiptRef, updateData);
    } catch (error) {
      console.error("Error updating receipt:", error);
      throw new Error("فشل في تحديث الإيصال");
    }
  },

  /**
   * Delete a receipt
   */
  async deleteReceipt(receiptId: string, tenantId?: string): Promise<void> {
    try {
      const collectionPath = getReceiptsPath(tenantId);
      const receiptRef = doc(db, collectionPath, receiptId);
      await deleteDoc(receiptRef);
    } catch (error) {
      console.error("Error deleting receipt:", error);
      throw new Error("فشل في حذف الإيصال");
    }
  },
};
