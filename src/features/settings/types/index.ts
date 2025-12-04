// Settings Feature Types

// Exchange Rates
export interface ExchangeRates {
  EGP: number;
  USD: number;
  GBP: number;
  lastUpdated: Date;
}

export interface Settings {
  id: string;
  exchangeRates: ExchangeRates;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Company Settings
export interface CompanySettings {
  id: string;
  companyName: string;
  companyPhone: string;
  whatsappQRCode: string; // Cloudinary URL
  companyLogo: string; // Cloudinary URL
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanySettingsFormData {
  companyName: string;
  companyPhone: string;
  whatsappQRCode?: string;
  companyLogo?: string;
}

// Store State
export interface SettingsState {
  settings: Settings | null;
  companySettings: CompanySettings | null;
  isLoading: boolean;
  error: string | null;
}
