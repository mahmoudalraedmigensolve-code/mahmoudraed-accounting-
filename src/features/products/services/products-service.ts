// Products Service Layer
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
import { Product, ProductFormData } from "../types";

// Helper to get collection path based on tenant - tenantId is REQUIRED
const getCollectionPath = (tenantId: string) => {
  if (!tenantId) throw new Error("Tenant ID is required");
  return `tenants/${tenantId}/products`;
};

// Helper to get hidden products collection path
const getHiddenProductsPath = (tenantId: string) => {
  if (!tenantId) throw new Error("Tenant ID is required");
  return `tenants/${tenantId}/hidden_products`;
};

export const productsService = {
  /**
   * Create a new product
   */
  async createProduct(
    productData: ProductFormData,
    userId: string,
    tenantId: string
  ): Promise<string> {
    try {
      const collectionPath = getCollectionPath(tenantId);
      const docRef = await addDoc(collection(db, collectionPath), {
        ...productData,
        userId,
        tenantId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create product");
    }
  },

  /**
   * Fetch all products for a user
   */
  async fetchProducts(userId: string, tenantId: string): Promise<Product[]> {
    try {
      const collectionPath = getCollectionPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        where("userId", "==", userId),
        orderBy("productName", "asc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Product;
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch products");
    }
  },

  /**
   * Update a product
   */
  async updateProduct(
    productId: string,
    productData: Partial<ProductFormData>,
    tenantId: string
  ): Promise<void> {
    try {
      const collectionPath = getCollectionPath(tenantId);
      const docRef = doc(db, collectionPath, productId);
      await updateDoc(docRef, {
        ...productData,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to update product");
    }
  },

  /**
   * Delete a product
   */
  async deleteProduct(productId: string, tenantId: string): Promise<void> {
    try {
      const collectionPath = getCollectionPath(tenantId);
      const docRef = doc(db, collectionPath, productId);
      await deleteDoc(docRef);
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete product");
    }
  },

  /**
   * Hide a product (for products from purchases - don't delete the purchase, just hide from products list)
   */
  async hideProduct(productName: string, userId: string, tenantId: string): Promise<void> {
    try {
      const hiddenPath = getHiddenProductsPath(tenantId);
      await addDoc(collection(db, hiddenPath), {
        productName,
        userId,
        tenantId,
        hiddenAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to hide product");
    }
  },

  /**
   * Fetch all hidden product names for a user
   */
  async fetchHiddenProducts(userId: string, tenantId: string): Promise<string[]> {
    try {
      const hiddenPath = getHiddenProductsPath(tenantId);
      const q = query(
        collection(db, hiddenPath),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data().productName as string);
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch hidden products");
    }
  },
};
