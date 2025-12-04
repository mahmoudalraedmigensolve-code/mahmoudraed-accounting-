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

// Helper to get collection path based on tenant
const getCollectionPath = (tenantId?: string) =>
  tenantId ? `tenants/${tenantId}/products` : "products";

export const productsService = {
  /**
   * Create a new product
   */
  async createProduct(
    productData: ProductFormData,
    userId: string,
    tenantId?: string
  ): Promise<string> {
    try {
      const collectionPath = getCollectionPath(tenantId);
      const docRef = await addDoc(collection(db, collectionPath), {
        ...productData,
        userId,
        tenantId: tenantId || null,
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
  async fetchProducts(userId: string, tenantId?: string): Promise<Product[]> {
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
    tenantId?: string
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
  async deleteProduct(productId: string, tenantId?: string): Promise<void> {
    try {
      const collectionPath = getCollectionPath(tenantId);
      const docRef = doc(db, collectionPath, productId);
      await deleteDoc(docRef);
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete product");
    }
  },
};
