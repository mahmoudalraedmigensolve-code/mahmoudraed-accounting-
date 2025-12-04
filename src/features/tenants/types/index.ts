export interface Tenant {
  id: string;
  name: string; // Company name
  slug: string; // URL-friendly identifier (e.g., "moffex")
  logo?: string; // Company logo URL
  phone?: string; // Company phone
  email?: string; // Company email
  address?: string; // Company address
  whatsappQRCode?: string; // WhatsApp QR code URL
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface TenantSettings {
  currency: string;
  language: string;
  timezone: string;
  // Exchange rates
  exchangeRates?: {
    USD: number;
    GBP: number;
  };
}

export interface TenantFormData {
  name: string;
  slug: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  whatsappQRCode?: string;
  settings?: Partial<TenantSettings>;
}

export interface TenantsState {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;
  error: string | null;
}

// Tenant User - users who can access a specific tenant
export interface TenantUser {
  id: string;
  tenantId: string;
  firebaseUid: string; // Firebase Auth UID
  email: string;
  displayName?: string;
  role: TenantUserRole;
  isActive: boolean;
  maxDevices: number; // Maximum number of devices allowed
  registeredDevices: DeviceInfo[]; // List of registered devices
  createdAt: Date;
  updatedAt: Date;
}

// Device information for tracking
export interface DeviceInfo {
  deviceId: string; // Unique device identifier
  deviceName: string; // Browser/device name
  userAgent: string; // Full user agent string
  registeredAt: Date;
  lastActiveAt: Date;
}

export type TenantUserRole = "owner" | "admin" | "user";

export interface TenantUserFormData {
  email: string;
  displayName?: string;
  role: TenantUserRole;
  maxDevices: number; // Number of devices allowed
}

// Default settings for new tenants
export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  currency: "EGP",
  language: "ar",
  timezone: "Africa/Cairo",
  exchangeRates: {
    USD: 50,
    GBP: 63,
  },
};
