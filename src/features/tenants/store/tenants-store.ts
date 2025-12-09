// Tenants Store - No persistence to ensure fresh data across devices
import { create } from "zustand";
import { tenantsService } from "../services/tenants-service";
import { Tenant, TenantFormData, TenantsState } from "../types";

interface TenantsStore extends TenantsState {
  // Actions
  setCurrentTenant: (tenant: Tenant | null) => void;
  fetchTenantById: (tenantId: string) => Promise<Tenant | null>;
  fetchTenantBySlug: (slug: string) => Promise<Tenant | null>;
  fetchAllTenants: () => Promise<void>;
  createTenant: (tenantData: TenantFormData) => Promise<string>;
  updateTenant: (tenantId: string, tenantData: Partial<TenantFormData>) => Promise<void>;
  updateTenantSettings: (settings: Partial<Tenant["settings"]>) => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTenantsStore = create<TenantsStore>()((set, get) => ({
  // Initial State
  currentTenant: null,
  tenants: [],
  isLoading: false,
  error: null,

  // Actions
  setCurrentTenant: (tenant: Tenant | null) => {
    set({ currentTenant: tenant });
  },

  fetchTenantById: async (tenantId: string) => {
    try {
      set({ isLoading: true, error: null });
      const tenant = await tenantsService.fetchTenantById(tenantId);
      if (tenant) {
        set({ currentTenant: tenant, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return tenant;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchTenantBySlug: async (slug: string) => {
    try {
      set({ isLoading: true, error: null });
      const tenant = await tenantsService.fetchTenantBySlug(slug);
      if (tenant) {
        set({ currentTenant: tenant, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return tenant;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  fetchAllTenants: async () => {
    try {
      set({ isLoading: true, error: null });
      const tenants = await tenantsService.fetchAllTenants();
      set({ tenants, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createTenant: async (tenantData: TenantFormData) => {
    try {
      set({ isLoading: true, error: null });
      const id = await tenantsService.createTenant(tenantData);
      const newTenant: Tenant = {
        id,
        ...tenantData,
        settings: {
          currency: "EGP",
          language: "ar",
          timezone: "Africa/Cairo",
          exchangeRates: { USD: 50, GBP: 63 },
          ...tenantData.settings,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      set((state) => ({
        tenants: [...state.tenants, newTenant],
        currentTenant: newTenant,
        isLoading: false,
      }));
      return id;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateTenant: async (
    tenantId: string,
    tenantData: Partial<TenantFormData>
  ) => {
    try {
      set({ isLoading: true, error: null });
      await tenantsService.updateTenant(tenantId, tenantData);

      // Extract settings separately to avoid type issues
      const { settings: newSettings, ...otherData } = tenantData;

      set((state) => {
        if (!state.currentTenant) {
          return { isLoading: false };
        }

        const updatedTenant: Tenant = {
          ...state.currentTenant,
          ...otherData,
          settings: newSettings
            ? { ...state.currentTenant.settings, ...newSettings }
            : state.currentTenant.settings,
          updatedAt: new Date(),
        };

        return {
          currentTenant: updatedTenant,
          tenants: state.tenants.map((tenant) =>
            tenant.id === tenantId ? updatedTenant : tenant
          ),
          isLoading: false,
        };
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateTenantSettings: async (settings: Partial<Tenant["settings"]>) => {
    const { currentTenant } = get();
    if (!currentTenant) {
      throw new Error("No tenant selected");
    }

    try {
      set({ isLoading: true, error: null });
      await tenantsService.updateTenantSettings(currentTenant.id, settings);
      set((state) => ({
        currentTenant: state.currentTenant
          ? {
              ...state.currentTenant,
              settings: { ...state.currentTenant.settings, ...settings },
              updatedAt: new Date(),
            }
          : null,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));
