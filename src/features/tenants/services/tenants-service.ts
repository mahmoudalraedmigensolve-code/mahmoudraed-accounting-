// Tenants Service Layer
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import { Tenant, TenantFormData, DEFAULT_TENANT_SETTINGS } from "../types";

const COLLECTION_NAME = "tenants";

export const tenantsService = {
  /**
   * Create a new tenant
   */
  async createTenant(tenantData: TenantFormData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...tenantData,
        settings: {
          ...DEFAULT_TENANT_SETTINGS,
          ...tenantData.settings,
        },
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create tenant");
    }
  },

  /**
   * Fetch tenant by ID
   */
  async fetchTenantById(tenantId: string): Promise<Tenant | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, tenantId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Tenant;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch tenant");
    }
  },

  /**
   * Fetch tenant by slug
   */
  async fetchTenantBySlug(slug: string): Promise<Tenant | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("slug", "==", slug),
        where("isActive", "==", true)
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
      } as Tenant;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch tenant");
    }
  },

  /**
   * Fetch all tenants
   */
  async fetchAllTenants(): Promise<Tenant[]> {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Tenant;
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch tenants");
    }
  },

  /**
   * Update tenant
   */
  async updateTenant(
    tenantId: string,
    tenantData: Partial<TenantFormData>
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, tenantId);
      await updateDoc(docRef, {
        ...tenantData,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to update tenant");
    }
  },

  /**
   * Update tenant settings
   */
  async updateTenantSettings(
    tenantId: string,
    settings: Partial<Tenant["settings"]>
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, tenantId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Tenant not found");
      }

      const currentSettings = docSnap.data().settings || {};

      await updateDoc(docRef, {
        settings: {
          ...currentSettings,
          ...settings,
        },
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to update tenant settings");
    }
  },
};
