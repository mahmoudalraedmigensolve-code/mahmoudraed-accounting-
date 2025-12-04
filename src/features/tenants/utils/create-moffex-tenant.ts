/**
 * Utility to create the initial "moffex" tenant
 * Run this once to set up the first tenant with existing data
 */

import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export interface MoffexTenantData {
  name: string;
  phone: string;
  logo: string;
  whatsappQRCode: string;
}

export async function createMoffexTenant(data: MoffexTenantData): Promise<string> {
  const tenantId = "moffex"; // Use a fixed ID for the first tenant

  try {
    // Create the tenant document
    const tenantRef = doc(db, "tenants", tenantId);
    await setDoc(tenantRef, {
      name: data.name || "Moffex",
      slug: "moffex",
      phone: data.phone || "",
      email: "",
      address: "",
      logo: data.logo || "",
      whatsappQRCode: data.whatsappQRCode || "",
      settings: {
        currency: "EGP",
        language: "ar",
        timezone: "Africa/Cairo",
        exchangeRates: {
          USD: 50,
          GBP: 63,
        },
      },
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log("Moffex tenant created successfully with ID:", tenantId);
    return tenantId;
  } catch (error) {
    console.error("Error creating moffex tenant:", error);
    throw error;
  }
}

/**
 * Migration utility to copy existing data to the new tenant structure
 * This preserves the original data while creating copies under the tenant
 */
export async function migrateDataToTenant(tenantId: string): Promise<void> {
  // All collections that need to be migrated
  const collections = [
    "purchases",
    "sales",
    "customers",
    "customer_receipts",
    "products",
    "suppliers",
    "supplierPayments",
  ];

  for (const collectionName of collections) {
    try {
      // Get all documents from the legacy collection
      const legacySnapshot = await getDocs(collection(db, collectionName));

      if (legacySnapshot.empty) {
        console.log(`No documents in ${collectionName} to migrate`);
        continue;
      }

      // Copy each document to the tenant subcollection
      const tenantCollectionPath = `tenants/${tenantId}/${collectionName}`;

      for (const docSnapshot of legacySnapshot.docs) {
        const data = docSnapshot.data();
        // Use the same document ID to maintain references
        const tenantDocRef = doc(db, tenantCollectionPath, docSnapshot.id);
        await setDoc(tenantDocRef, {
          ...data,
          tenantId,
          migratedAt: Timestamp.now(),
        });
      }

      console.log(`Migrated ${legacySnapshot.size} documents from ${collectionName}`);
    } catch (error) {
      console.error(`Error migrating ${collectionName}:`, error);
    }
  }

  console.log("Data migration completed!");
}
