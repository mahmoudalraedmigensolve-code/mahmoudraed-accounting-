"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { usePurchasesStore } from "@/features/purchases/store/purchases-store";
import { PurchasesTable } from "@/features/purchases/components/purchases-table";
import { useSettingsStore } from "@/features/settings/store/settings-store";

export default function PurchasesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { purchases, isLoading, fetchPurchases, error } = usePurchasesStore();
  const {
    fetchSettings,
    updateExchangeRatesFromApi,
    getExchangeRates,
    shouldUpdateRates,
  } = useSettingsStore();

  useEffect(() => {
    if (user) {
      fetchPurchases(user.uid);

      // Fetch settings and auto-update rates if needed
      fetchSettings(user.uid).then(() => {
        if (shouldUpdateRates()) {
          updateExchangeRatesFromApi(user.uid).catch((error) => {
            console.error("Failed to auto-update exchange rates:", error);
          });
        }
      });
    }
  }, [user, fetchPurchases, fetchSettings, updateExchangeRatesFromApi, shouldUpdateRates]);

  const exchangeRates = getExchangeRates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">المشتريات</h1>
          <p className="text-slate-600 mt-1">إدارة جميع المشتريات والسلع</p>
        </div>
        <Button onClick={() => router.push("/purchases/add")}>
          <svg
            className="w-5 h-5 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          إضافة سلعة جديدة
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">إجمالي السلع</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {purchases.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          className="bg-white p-6 rounded-lg border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/inventory")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">إجمالي الكميات</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {purchases.reduce((sum, p) => sum + p.quantity, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">إجمالي المشتريات</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {purchases
                  .reduce((sum, p) => sum + p.purchasePrice, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">إجمالي الربح المتوقع</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {purchases
                  .reduce((sum, p) => {
                    // Convert prices to EGP (prices are already total)
                    const purchasePriceInEGP = p.purchasePrice * exchangeRates[p.currency];
                    const sellingPriceInEGP = p.sellingPrice * exchangeRates[p.currency];
                    const profit = sellingPriceInEGP - purchasePriceInEGP;
                    return sum + profit;
                  }, 0)
                  .toFixed(2)} ج.م
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <PurchasesTable purchases={purchases} />
    </div>
  );
}
