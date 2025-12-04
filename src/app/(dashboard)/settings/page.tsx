"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useSettingsStore } from "@/features/settings/store/settings-store";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";
import { TenantSettingsForm } from "@/features/tenants/components/tenant-settings-form";
import { ExchangeRatesForm } from "@/features/settings/components/ExchangeRatesForm";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { currentTenant, updateTenant, updateTenantSettings } = useTenantsStore();
  const {
    settings,
    fetchSettings,
    updateExchangeRatesFromApi,
    updateExchangeRatesManual,
  } = useSettingsStore();

  useEffect(() => {
    if (user) {
      fetchSettings(user.uid);
    }
  }, [user, fetchSettings]);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-muted-foreground">
          يرجى تسجيل الدخول للوصول إلى الإعدادات
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">الإعدادات</h1>

      <div className="space-y-8">
        <TenantSettingsForm
          tenant={currentTenant}
          onSave={async (data) => {
            if (currentTenant) {
              await updateTenant(currentTenant.id, data);
            }
          }}
        />

        <ExchangeRatesForm
          settings={settings}
          userId={user.uid}
          onAutoUpdate={async () => {
            await updateExchangeRatesFromApi(user.uid);
            // Also update tenant settings with new rates
            if (settings?.exchangeRates && currentTenant) {
              await updateTenantSettings({
                exchangeRates: settings.exchangeRates,
              });
            }
          }}
          onManualUpdate={async (rates) => {
            await updateExchangeRatesManual(user.uid, rates);
            // Also update tenant settings with new rates
            if (currentTenant) {
              await updateTenantSettings({
                exchangeRates: rates,
              });
            }
          }}
        />
      </div>
    </div>
  );
}
