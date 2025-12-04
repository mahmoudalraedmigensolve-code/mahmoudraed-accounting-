"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useSalesStore } from "@/features/sales/store/sales-store";
import { usePurchasesStore } from "@/features/purchases/store/purchases-store";
import { SalesTable } from "@/features/sales/components/sales-table";

export default function SalesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sales, isLoading, fetchSales, fetchCustomers } = useSalesStore();
  const { purchases, fetchPurchases } = usePurchasesStore();

  useEffect(() => {
    if (user) {
      fetchSales(user.uid);
      fetchCustomers(user.uid);
      fetchPurchases(user.uid);
    }
  }, [user, fetchSales, fetchCustomers, fetchPurchases]);

  // Filter out payment invoices - only show actual sales
  const actualSales = sales.filter((sale) => sale.invoiceType !== "payment");

  // Calculate statistics (excluding payment invoices)
  const totalRevenue = actualSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalPaid = actualSales.reduce((sum, sale) => sum + sale.paidAmount, 0);
  const totalInvoices = actualSales.length;

  // Calculate total profit
  const totalProfit = actualSales.reduce((sum, sale) => {
    // Calculate profit for each sale by comparing selling price with purchase price
    const saleProfit = sale.items.reduce((itemSum, item) => {
      // Find the product in purchases to get the purchase price
      const product = purchases.find((p) => p.id === item.productId);
      if (product) {
        // Profit = (selling price - purchase price) × quantity
        const profitPerUnit = item.unitPrice - product.unitPurchasePrice;
        return itemSum + profitPerUnit * item.quantity;
      }
      return itemSum;
    }, 0);
    return sum + saleProfit;
  }, 0);

  // Calculate total deferred amount (المتبقي)
  const totalDeferred = actualSales.reduce((sum, sale) => sum + sale.deferredAmount, 0);

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
          <h1 className="text-3xl font-bold text-slate-900">المبيعات</h1>
          <p className="text-slate-600 mt-1">إدارة فواتير البيع والعملاء</p>
        </div>
        <Button onClick={() => router.push("/sales/add")}>
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
          إضافة فاتورة جديدة
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {/* Total Invoices */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">إجمالي الفواتير</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {totalInvoices}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {totalRevenue.toFixed(2)} ج.م
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">إجمالي المدفوع</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {totalPaid.toFixed(2)} ج.م
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">إجمالي الربح</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {totalProfit.toFixed(2)} ج.م
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <svg
                className="w-6 h-6 text-amber-600"
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

        {/* Total Deferred */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">إجمالي المتبقي</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {totalDeferred.toFixed(2)} ج.م
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <SalesTable sales={actualSales} />
    </div>
  );
}
