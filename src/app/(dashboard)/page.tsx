"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useSalesStore } from "@/features/sales/store/sales-store";
import { usePurchasesStore } from "@/features/purchases/store/purchases-store";

export default function DashboardHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sales, fetchSales } = useSalesStore();
  const { purchases, fetchPurchases } = usePurchasesStore();

  useEffect(() => {
    if (user) {
      fetchSales(user.uid);
      fetchPurchases(user.uid);
    }
  }, [user, fetchSales, fetchPurchases]);

  // Calculate statistics
  const stats = useMemo(() => {
    // Total sales amount
    const totalSales = sales
      .filter((sale) => sale.invoiceType !== "payment")
      .reduce((sum, sale) => sum + sale.totalAmount, 0);

    // Total purchases amount
    const totalPurchases = purchases.reduce(
      (sum, purchase) => sum + purchase.purchasePrice,
      0
    );

    // Total collected (paid amounts from sales)
    const totalCollected = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);

    // Total customer debt (current balances)
    const uniqueCustomers = new Map<string, number>();
    sales.forEach((sale) => {
      if (sale.customerPhone) {
        uniqueCustomers.set(sale.customerPhone, sale.currentBalance);
      }
    });
    const totalCustomerDebt = Array.from(uniqueCustomers.values()).reduce(
      (sum, balance) => sum + balance,
      0
    );

    // Total supplier debt (purchases don't have paidAmount tracking currently)
    // For now, we just show total purchase amount as debt indicator
    const uniqueSuppliers = new Map<string, number>();
    purchases.forEach((purchase) => {
      if (purchase.supplierPhone) {
        const current = uniqueSuppliers.get(purchase.supplierPhone) || 0;
        uniqueSuppliers.set(purchase.supplierPhone, current + purchase.purchasePrice);
      }
    });
    const totalSupplierDebt = 0; // Will be calculated when supplier payments are implemented

    // Count of invoices
    const salesCount = sales.filter((s) => s.invoiceType !== "payment").length;
    const purchasesCount = purchases.length;

    // Available inventory
    const inventoryMap = new Map<string, number>();
    purchases.forEach((p) => {
      const current = inventoryMap.get(p.productName) || 0;
      inventoryMap.set(p.productName, current + p.quantity);
    });
    sales
      .filter((s) => s.invoiceType !== "payment")
      .forEach((sale) => {
        sale.items.forEach((item) => {
          const current = inventoryMap.get(item.productName) || 0;
          inventoryMap.set(item.productName, current - item.quantity);
        });
      });
    const totalInventory = Array.from(inventoryMap.values()).reduce(
      (sum, qty) => sum + qty,
      0
    );
    const productCount = inventoryMap.size;

    return {
      totalSales,
      totalPurchases,
      totalCollected,
      totalCustomerDebt,
      totalSupplierDebt,
      salesCount,
      purchasesCount,
      totalInventory,
      productCount,
    };
  }, [sales, purchases]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            لوحة التحكم
          </h1>
          <p className="text-slate-600 mt-1">نظرة عامة على نشاطك التجاري</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
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
            <div>
              <p className="text-xs text-slate-500">إجمالي المبيعات</p>
              <p className="text-lg font-bold text-green-600">
                {stats.totalSales.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
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
            <div>
              <p className="text-xs text-slate-500">إجمالي المشتريات</p>
              <p className="text-lg font-bold text-blue-600">
                {stats.totalPurchases.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>
        </div>

        {/* Customer Debt */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500">ديون العملاء</p>
              <p className="text-lg font-bold text-orange-600">
                {stats.totalCustomerDebt.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>
        </div>

        {/* Supplier Debt */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-500">ديون الموردين</p>
              <p className="text-lg font-bold text-red-600">
                {stats.totalSupplierDebt.toLocaleString("ar-EG")} ج.م
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sales Card */}
        <button
          onClick={() => router.push("/sales")}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white text-right hover:from-green-600 hover:to-green-700 transition-all hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="text-3xl font-bold">{stats.salesCount}</span>
          </div>
          <h3 className="text-lg font-semibold">المبيعات</h3>
          <p className="text-green-100 text-sm">إدارة فواتير المبيعات والعملاء</p>
        </button>

        {/* Purchases Card */}
        <button
          onClick={() => router.push("/purchases")}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white text-right hover:from-blue-600 hover:to-blue-700 transition-all hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6"
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
            <span className="text-3xl font-bold">{stats.purchasesCount}</span>
          </div>
          <h3 className="text-lg font-semibold">المشتريات</h3>
          <p className="text-blue-100 text-sm">إدارة فواتير المشتريات والموردين</p>
        </button>

        {/* Inventory Card */}
        <button
          onClick={() => router.push("/inventory")}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white text-right hover:from-purple-600 hover:to-purple-700 transition-all hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-3xl font-bold">{stats.totalInventory}</span>
              <p className="text-purple-200 text-xs">{stats.productCount} منتج</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold">المخزون</h3>
          <p className="text-purple-100 text-sm">إدارة الكميات والمنتجات</p>
        </button>
      </div>

      {/* Reports Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Reports */}
        <button
          onClick={() => router.push("/reports/customers")}
          className="bg-white rounded-xl border border-slate-200 p-5 text-right hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <svg
                className="w-7 h-7 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">تقارير العملاء</h3>
              <p className="text-slate-500 text-sm">
                كشوف حساب وتفاصيل ديون العملاء
              </p>
            </div>
            <svg
              className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>

        {/* Supplier Reports */}
        <button
          onClick={() => router.push("/reports/suppliers")}
          className="bg-white rounded-xl border border-slate-200 p-5 text-right hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
              <svg
                className="w-7 h-7 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">تقارير الموردين</h3>
              <p className="text-slate-500 text-sm">
                كشوف حساب ومدفوعات الموردين
              </p>
            </div>
            <svg
              className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>
      </div>

      {/* Settings Link */}
      <button
        onClick={() => router.push("/settings")}
        className="w-full bg-slate-50 rounded-xl border border-slate-200 p-4 text-right hover:bg-slate-100 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center group-hover:bg-slate-300 transition-colors">
            <svg
              className="w-5 h-5 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">الإعدادات</h3>
            <p className="text-slate-500 text-sm">
              إدارة بيانات الشركة وأسعار الصرف
            </p>
          </div>
          <svg
            className="w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </button>
    </div>
  );
}
