import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Supplier, SupplierPayment } from "../types";

// Helper functions for collection paths - tenantId is REQUIRED
const getSuppliersPath = (tenantId: string) => {
  if (!tenantId) throw new Error("Tenant ID is required");
  return `tenants/${tenantId}/suppliers`;
};
const getPaymentsPath = (tenantId: string) => {
  if (!tenantId) throw new Error("Tenant ID is required");
  return `tenants/${tenantId}/supplierPayments`;
};

export const suppliersService = {
  // Fetch all suppliers for a user
  async fetchSuppliers(userId: string, tenantId: string): Promise<Supplier[]> {
    try {
      const collectionPath = getSuppliersPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Supplier[];
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      throw error;
    }
  },

  // Create a new supplier
  async createSupplier(
    supplierData: Omit<Supplier, "id">,
    tenantId: string
  ): Promise<string> {
    try {
      const collectionPath = getSuppliersPath(tenantId);
      const docRef = await addDoc(collection(db, collectionPath), {
        ...supplierData,
        tenantId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating supplier:", error);
      throw error;
    }
  },

  // Update supplier balance
  async updateSupplierBalance(
    supplierId: string,
    newBalance: number,
    tenantId: string
  ): Promise<void> {
    try {
      const collectionPath = getSuppliersPath(tenantId);
      const supplierRef = doc(db, collectionPath, supplierId);
      await updateDoc(supplierRef, {
        totalBalance: newBalance,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating supplier balance:", error);
      throw error;
    }
  },

  // Record a payment to supplier
  async recordPayment(
    paymentData: Omit<SupplierPayment, "id">,
    tenantId: string
  ): Promise<string> {
    try {
      const collectionPath = getPaymentsPath(tenantId);
      const docRef = await addDoc(collection(db, collectionPath), {
        ...paymentData,
        tenantId,
        paymentDate: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error recording supplier payment:", error);
      throw error;
    }
  },

  // Fetch all payments for a supplier
  async fetchSupplierPayments(
    supplierId: string,
    tenantId: string
  ): Promise<SupplierPayment[]> {
    try {
      const collectionPath = getPaymentsPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        where("supplierId", "==", supplierId),
        orderBy("paymentDate", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        paymentDate: doc.data().paymentDate?.toDate() || new Date(),
      })) as SupplierPayment[];
    } catch (error) {
      console.error("Error fetching supplier payments:", error);
      throw error;
    }
  },

  // Fetch all payments for a user (for reports)
  async fetchAllPayments(
    userId: string,
    tenantId: string
  ): Promise<SupplierPayment[]> {
    try {
      const collectionPath = getPaymentsPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        where("userId", "==", userId),
        orderBy("paymentDate", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        paymentDate: doc.data().paymentDate?.toDate() || new Date(),
      })) as SupplierPayment[];
    } catch (error) {
      console.error("Error fetching all supplier payments:", error);
      throw error;
    }
  },
};
