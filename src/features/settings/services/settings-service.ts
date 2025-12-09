// Settings Service - Firebase Firestore operations
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firestore";
import type { Settings, ExchangeRates, CompanySettings, CompanySettingsFormData } from "../types";

// Helper functions for collection paths - tenantId is REQUIRED
const getSettingsPath = (tenantId: string) => {
  if (!tenantId) throw new Error("Tenant ID is required");
  return `tenants/${tenantId}/settings`;
};
const getCompanySettingsPath = (tenantId: string) => {
  if (!tenantId) throw new Error("Tenant ID is required");
  return `tenants/${tenantId}/company_settings`;
};

/**
 * Converts Firestore document to Settings object
 */
function convertToSettings(id: string, data: any): Settings {
  return {
    id,
    exchangeRates: {
      EGP: data.exchangeRates.EGP,
      USD: data.exchangeRates.USD,
      GBP: data.exchangeRates.GBP,
      lastUpdated: data.exchangeRates.lastUpdated instanceof Timestamp
        ? data.exchangeRates.lastUpdated.toDate()
        : new Date(data.exchangeRates.lastUpdated),
    },
    userId: data.userId,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp
      ? data.updatedAt.toDate()
      : new Date(data.updatedAt),
  };
}

/**
 * Fetches user settings from Firestore
 */
export async function fetchSettings(userId: string, tenantId: string): Promise<Settings | null> {
  try {
    const collectionPath = getSettingsPath(tenantId);
    const docRef = doc(db, collectionPath, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return convertToSettings(docSnap.id, docSnap.data());
    }

    return null;
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw new Error("Failed to fetch settings");
  }
}

/**
 * Updates exchange rates in user settings
 */
export async function updateExchangeRates(
  userId: string,
  rates: Omit<ExchangeRates, "lastUpdated">,
  tenantId: string
): Promise<void> {
  try {
    const collectionPath = getSettingsPath(tenantId);
    const docRef = doc(db, collectionPath, userId);
    const docSnap = await getDoc(docRef);

    const now = new Date();

    if (docSnap.exists()) {
      // Update existing settings
      await setDoc(
        docRef,
        {
          exchangeRates: {
            ...rates,
            lastUpdated: now,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // Create new settings document
      await setDoc(docRef, {
        exchangeRates: {
          ...rates,
          lastUpdated: now,
        },
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Error updating exchange rates:", error);
    throw new Error("Failed to update exchange rates");
  }
}

/**
 * Fetches company settings from Firestore
 */
export async function fetchCompanySettings(userId: string, tenantId: string): Promise<CompanySettings | null> {
  try {
    console.log('🔍 Fetching company settings from Firebase for user:', userId);
    const collectionPath = getCompanySettingsPath(tenantId);
    const docRef = doc(db, collectionPath, userId);
    const docSnap = await getDoc(docRef);

    console.log('📦 Document exists:', docSnap.exists());

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('✅ Company settings data:', data);

      const settings = {
        id: docSnap.id,
        companyName: data.companyName || "",
        companyPhone: data.companyPhone || "",
        whatsappQRCode: data.whatsappQRCode || "",
        companyLogo: data.companyLogo || "",
        userId: data.userId,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate()
          : new Date(data.updatedAt),
      };

      console.log('📤 Returning settings:', settings);
      return settings;
    }

    console.log('❌ No company settings document found in Firebase');
    return null;
  } catch (error) {
    console.error("❌ Error fetching company settings:", error);
    throw new Error("Failed to fetch company settings");
  }
}

/**
 * Updates or creates company settings
 */
export async function updateCompanySettings(
  userId: string,
  settingsData: CompanySettingsFormData,
  tenantId: string
): Promise<void> {
  try {
    console.log('💾 Updating company settings for user:', userId);
    console.log('📝 Settings data to save:', settingsData);

    const collectionPath = getCompanySettingsPath(tenantId);
    const docRef = doc(db, collectionPath, userId);

    await setDoc(
      docRef,
      {
        ...settingsData,
        userId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log('✅ Company settings saved successfully to Firebase!');
  } catch (error) {
    console.error("❌ Error updating company settings:", error);
    throw new Error("Failed to update company settings");
  }
}

/**
 * Creates initial company settings
 */
export async function createCompanySettings(
  userId: string,
  settingsData: CompanySettingsFormData,
  tenantId: string
): Promise<void> {
  try {
    console.log('🆕 Creating new company settings for user:', userId);
    console.log('📝 Settings data to create:', settingsData);

    const collectionPath = getCompanySettingsPath(tenantId);
    const docRef = doc(db, collectionPath, userId);

    await setDoc(docRef, {
      ...settingsData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Company settings created successfully in Firebase!');
  } catch (error) {
    console.error("❌ Error creating company settings:", error);
    throw new Error("Failed to create company settings");
  }
}
