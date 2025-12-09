// Settings Store - Zustand state management - No persistence to ensure fresh data across devices
import { create } from "zustand";
import type { SettingsState, ExchangeRates, CompanySettingsFormData } from "../types";
import {
  fetchSettings,
  updateExchangeRates,
  fetchCompanySettings,
  updateCompanySettings,
  createCompanySettings,
} from "../services/settings-service";
import { fetchExchangeRates as fetchRatesFromApi } from "../services/exchange-rate-api";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";

// Helper to get current tenant ID - throws error if not available
const getTenantId = (): string => {
  const tenantId = useTenantsStore.getState().currentTenant?.id;
  if (!tenantId) {
    throw new Error("Tenant ID is required. Please make sure you are logged in.");
  }
  return tenantId;
};

interface SettingsStore extends SettingsState {
  // Exchange Rates
  fetchSettings: (userId: string) => Promise<void>;
  updateExchangeRatesFromApi: (userId: string) => Promise<void>;
  updateExchangeRatesManual: (userId: string, rates: Omit<ExchangeRates, "lastUpdated">) => Promise<void>;
  getExchangeRates: () => { EGP: number; USD: number; GBP: number };
  shouldUpdateRates: () => boolean;

  // Company Settings
  fetchCompanySettings: (userId: string) => Promise<void>;
  updateCompanySettings: (userId: string, settingsData: CompanySettingsFormData) => Promise<void>;
}

// Default exchange rates (fallback)
const DEFAULT_RATES = {
  EGP: 1,
  USD: 50,
  GBP: 65,
};

export const useSettingsStore = create<SettingsStore>()((set, get) => ({
  settings: null,
  companySettings: null,
  isLoading: false,
  error: null,

  fetchSettings: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const settings = await fetchSettings(userId, tenantId);
      set({ settings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch settings",
        isLoading: false
      });
    }
  },

  updateExchangeRatesFromApi: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const rates = await fetchRatesFromApi();
      await updateExchangeRates(userId, rates, tenantId);
      const settings = await fetchSettings(userId, tenantId);
      set({ settings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update exchange rates",
        isLoading: false
      });
      throw error;
    }
  },

  updateExchangeRatesManual: async (userId: string, rates: Omit<ExchangeRates, "lastUpdated">) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      await updateExchangeRates(userId, rates, tenantId);
      const settings = await fetchSettings(userId, tenantId);
      set({ settings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update exchange rates",
        isLoading: false
      });
      throw error;
    }
  },

  getExchangeRates: () => {
    const { settings } = get();
    if (settings?.exchangeRates) {
      return {
        EGP: settings.exchangeRates.EGP,
        USD: settings.exchangeRates.USD,
        GBP: settings.exchangeRates.GBP,
      };
    }
    return DEFAULT_RATES;
  },

  shouldUpdateRates: () => {
    const { settings } = get();
    if (!settings?.exchangeRates?.lastUpdated) {
      return true;
    }

    const lastUpdated = settings.exchangeRates.lastUpdated;
    const now = new Date();
    const diffInHours = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    return diffInHours >= 24;
  },

  // Company Settings Actions
  fetchCompanySettings: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const companySettings = await fetchCompanySettings(userId, tenantId);
      set({ companySettings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch company settings",
        isLoading: false,
      });
    }
  },

  updateCompanySettings: async (userId: string, settingsData: CompanySettingsFormData) => {
    set({ isLoading: true, error: null });
    try {
      const tenantId = getTenantId();
      const existingSettings = get().companySettings;

      if (existingSettings) {
        await updateCompanySettings(userId, settingsData, tenantId);
      } else {
        await createCompanySettings(userId, settingsData, tenantId);
      }

      const companySettings = await fetchCompanySettings(userId, tenantId);
      set({ companySettings, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update company settings",
        isLoading: false,
      });
      throw error;
    }
  },
}));
