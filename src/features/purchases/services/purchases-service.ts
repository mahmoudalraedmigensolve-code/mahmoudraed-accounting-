// Purchases Service Layer
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { Purchase, PurchaseFormData } from "../types";

// Helper to get collection path based on tenant
const getCollectionPath = (tenantId: string) => `tenants/${tenantId}/purchases`;

// Legacy collection for backwards compatibility
const LEGACY_COLLECTION = "purchases";

export const purchasesService = {
  /**
   * Create a new purchase
   */
  async createPurchase(
    purchaseData: PurchaseFormData,
    userId: string,
    tenantId?: string
  ): Promise<string> {
    try {
      const collectionPath = tenantId
        ? getCollectionPath(tenantId)
        : LEGACY_COLLECTION;

      const docRef = await addDoc(collection(db, collectionPath), {
        ...purchaseData,
        userId,
        tenantId: tenantId || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create purchase");
    }
  },

  /**
   * Fetch all purchases for a user (with optional tenant filter)
   */
  async fetchPurchases(userId: string, tenantId?: string): Promise<Purchase[]> {
    try {
      let q;

      if (tenantId) {
        // New multi-tenant structure
        q = query(
          collection(db, getCollectionPath(tenantId)),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
      } else {
        // Legacy structure
        q = query(
          collection(db, LEGACY_COLLECTION),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Handle old purchases that don't have unitPurchasePrice
          unitPurchasePrice:
            data.unitPurchasePrice || data.purchasePrice / data.quantity || 0,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Purchase;
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch purchases");
    }
  },

  /**
   * Update a purchase
   */
  async updatePurchase(
    purchaseId: string,
    purchaseData: Partial<PurchaseFormData>,
    tenantId?: string
  ): Promise<void> {
    try {
      const collectionPath = tenantId
        ? getCollectionPath(tenantId)
        : LEGACY_COLLECTION;

      const docRef = doc(db, collectionPath, purchaseId);
      await updateDoc(docRef, {
        ...purchaseData,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to update purchase");
    }
  },

  /**
   * Delete a purchase
   */
  async deletePurchase(purchaseId: string, tenantId?: string): Promise<void> {
    try {
      const collectionPath = tenantId
        ? getCollectionPath(tenantId)
        : LEGACY_COLLECTION;

      const docRef = doc(db, collectionPath, purchaseId);
      await deleteDoc(docRef);
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete purchase");
    }
  },

  /**
   * Update selling price for all purchases with the same product name
   */
  async updateSellingPriceByProductName(
    userId: string,
    productName: string,
    newUnitSellingPrice: number,
    tenantId?: string
  ): Promise<void> {
    try {
      const collectionPath = tenantId
        ? getCollectionPath(tenantId)
        : LEGACY_COLLECTION;

      // Fetch all purchases for this user with this product name
      const q = query(
        collection(db, collectionPath),
        where("userId", "==", userId),
        where("productName", "==", productName)
      );

      const querySnapshot = await getDocs(q);

      // Update each purchase
      const updatePromises = querySnapshot.docs.map((document) => {
        const data = document.data();
        const quantity = data.quantity || 0;
        const newSellingPrice = newUnitSellingPrice * quantity;

        return updateDoc(doc(db, collectionPath, document.id), {
          unitSellingPrice: newUnitSellingPrice,
          sellingPrice: newSellingPrice,
          updatedAt: Timestamp.now(),
        });
      });

      await Promise.all(updatePromises);
    } catch (error: any) {
      throw new Error(error.message || "Failed to update selling price");
    }
  },

  /**
   * Delete all purchases for a supplier (delete supplier completely)
   */
  async deleteSupplier(
    userId: string,
    supplierName: string,
    tenantId?: string
  ): Promise<void> {
    try {
      const collectionPath = tenantId
        ? getCollectionPath(tenantId)
        : LEGACY_COLLECTION;

      // Fetch all purchases for this user with this supplier name
      const q = query(
        collection(db, collectionPath),
        where("userId", "==", userId),
        where("supplierName", "==", supplierName)
      );

      const querySnapshot = await getDocs(q);

      // Delete each purchase
      const deletePromises = querySnapshot.docs.map((document) =>
        deleteDoc(doc(db, collectionPath, document.id))
      );

      await Promise.all(deletePromises);
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete supplier");
    }
  },
};
