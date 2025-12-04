"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { usePurchasesStore } from "@/features/purchases/store/purchases-store";

interface SupplierReport {
  supplierName: string;
  totalPurchases: number;
  totalAmount: number;
  totalQuantity: number;
  purchaseCount: number;
}

type SearchType = "all" | "name" | "count" | "quantity" | "amount";

export default function SuppliersReportPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { purchases, isLoading, fetchPurchases, deleteSupplier } = usePurchasesStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("all");
  const [deletingSupplier, setDeletingSupplier] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPurchases(user.uid);
    }
  }, [user, fetchPurchases]);

  // Group purchases by supplier
  const supplierReports = useMemo<SupplierReport[]>(() => {
    const grouped = new Map<string, SupplierReport>();

    purchases.forEach((purchase) => {
      const existing = grouped.get(purchase.supplierName);
      // purchasePrice is already the total (unitPrice * quantity)
      const purchaseTotal = purchase.purchasePrice;

      if (existing) {
        existing.totalAmount += purchaseTotal;
        existing.totalQuantity += purchase.quantity;
        existing.purchaseCount += 1;
      } else {
        grouped.set(purchase.supplierName, {
          supplierName: purchase.supplierName,
          totalPurchases: purchaseTotal,
          totalAmount: purchaseTotal,
          totalQuantity: purchase.quantity,
          purchaseCount: 1,
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.supplierName.localeCompare(b.supplierName, "ar")
    );
  }, [purchases]);

  // Filter suppliers based on search query and search type
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) {
      return supplierReports;
    }

    const query = searchQuery.toLowerCase().trim();

    return supplierReports.filter((supplier) => {
      // Search based on selected type
      switch (searchType) {
        case "name":
          return supplier.supplierName.toLowerCase().startsWith(query);

        case "count":
          return supplier.purchaseCount.toString().startsWith(query);

        case "quantity":
          return supplier.totalQuantity.toString().startsWith(query);

        case "amount":
          return supplier.totalAmount.toString().startsWith(query);

        case "all":
        default:
          // Search in all fields (from start)
          return (
            supplier.supplierName.toLowerCase().startsWith(query) ||
            supplier.purchaseCount.toString().startsWith(query) ||
            supplier.totalQuantity.toString().startsWith(query) ||
            supplier.totalAmount.toString().startsWith(query)
          );
      }
    });
  }, [supplierReports, searchQuery, searchType]);

  // Handle delete supplier
  const handleDeleteSupplier = async (supplierName: string) => {
    if (!user) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف المورد "${supplierName}"؟\nسيتم حذف جميع المشتريات المرتبطة بهذا المورد أيضاً.`
    );

    if (!confirmed) return;

    try {
      setDeletingSupplier(supplierName);
      await deleteSupplier(user.uid, supplierName);
    } catch (error: any) {
      alert(error.message || "فشل في حذف المورد");
    } finally {
      setDeletingSupplier(null);
    }
  };

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
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">تقارير الموردين</h1>
            <p className="text-slate-600 mt-1">عرض جميع الموردين وتفاصيل المشتريات</p>
          </div>

          {/* Search Input & Type Selector - على الشمال */}
          <div className="flex items-center gap-3">
            {/* Search Type Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-40">
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  {searchType === "all" && "البحث في الكل"}
                  {searchType === "name" && "اسم المورد"}
                  {searchType === "count" && "عدد المشتريات"}
                  {searchType === "quantity" && "إجمالي الكمية"}
                  {searchType === "amount" && "إجمالي المبلغ"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setSearchType("all")}
                  className={`cursor-pointer ${searchType === "all" ? "bg-slate-100" : ""}`}
                >
                  البحث في الكل
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSearchType("name")}
                  className={`cursor-pointer ${searchType === "name" ? "bg-slate-100" : ""}`}
                >
                  اسم المورد
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSearchType("count")}
                  className={`cursor-pointer ${searchType === "count" ? "bg-slate-100" : ""}`}
                >
                  عدد المشتريات
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSearchType("quantity")}
                  className={`cursor-pointer ${searchType === "quantity" ? "bg-slate-100" : ""}`}
                >
                  إجمالي الكمية
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSearchType("amount")}
                  className={`cursor-pointer ${searchType === "amount" ? "bg-slate-100" : ""}`}
                >
                  إجمالي المبلغ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Input
                type="text"
                placeholder={
                  searchType === "all"
                    ? "بحث عن مورد، عدد المشتريات، الكمية أو المبلغ..."
                    : searchType === "name"
                    ? "بحث عن اسم المورد..."
                    : searchType === "count"
                    ? "بحث عن عدد المشتريات..."
                    : searchType === "quantity"
                    ? "بحث عن إجمالي الكمية..."
                    : "بحث عن إجمالي المبلغ..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 w-full"
                dir="rtl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                >
                  <svg
                    className="h-5 w-5 text-slate-400 hover:text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      {supplierReports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <svg
            className="w-16 h-16 mx-auto text-slate-300 mb-4"
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
          <p className="text-slate-500 text-lg">لا توجد مشتريات بعد</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <svg
            className="w-16 h-16 mx-auto text-slate-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-slate-500 text-lg">لا توجد نتائج للبحث</p>
          <p className="text-slate-400 text-sm mt-2">جرب كلمات بحث مختلفة</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200" dir="rtl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-right px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    اسم المورد
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">
                    عدد المشتريات
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                    إجمالي الكمية
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    إجمالي المبلغ
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredSuppliers.map((supplier, index) => (
                    <tr
                      key={supplier.supplierName}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-medium text-slate-900">
                        {index + 1}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-slate-900">
                        {supplier.supplierName}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden sm:table-cell">
                        {supplier.purchaseCount}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden md:table-cell">
                        {supplier.totalQuantity}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-semibold text-green-600">
                        {supplier.totalAmount.toFixed(2)} ج.م
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                router.push(`/reports/suppliers/payment?name=${encodeURIComponent(supplier.supplierName)}`);
                              }}
                              className="cursor-pointer"
                            >
                              <svg
                                className="w-4 h-4 ml-2"
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
                              تسديد مبلغ
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                router.push(`/reports/suppliers/statement?name=${encodeURIComponent(supplier.supplierName)}`);
                              }}
                              className="cursor-pointer"
                            >
                              <svg
                                className="w-4 h-4 ml-2"
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
                              كشف الحساب
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSupplier(supplier.supplierName)}
                              className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                              disabled={deletingSupplier === supplier.supplierName}
                            >
                              <svg
                                className="w-4 h-4 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              {deletingSupplier === supplier.supplierName ? "جاري الحذف..." : "حذف"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
