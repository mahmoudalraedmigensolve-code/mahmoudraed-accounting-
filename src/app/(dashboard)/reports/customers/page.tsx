"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useSalesStore } from "@/features/sales/store/sales-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomerReport {
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalSales: number;
  totalAmount: number;
  currentBalance: number;
}

type SearchType = "all" | "name" | "phone" | "count" | "sales" | "balance";

export default function CustomersReportPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sales, customers, isLoading, fetchSales, fetchCustomers, deleteCustomer } = useSalesStore();
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("all");

  useEffect(() => {
    if (user) {
      fetchSales(user.uid);
      fetchCustomers(user.uid);
    }
  }, [user, fetchSales, fetchCustomers]);

  // Get customer reports with balance from customers collection
  const customerReports = useMemo<CustomerReport[]>(() => {
    return customers.map((customer) => {
      // Get all sales for this customer
      const customerSales = sales.filter((s) => s.customerId === customer.id);

      return {
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        totalSales: customerSales.length,
        totalAmount: customerSales.reduce((sum, s) => sum + s.totalAmount, 0),
        currentBalance: customer.totalBalance,
      };
    }).sort((a, b) => a.customerName.localeCompare(b.customerName, "ar"));
  }, [customers, sales]);

  // Filter customers based on search query and search type
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return customerReports;
    }

    const query = searchQuery.toLowerCase().trim();

    return customerReports.filter((customer) => {
      // Search based on selected type
      switch (searchType) {
        case "name":
          return customer.customerName.toLowerCase().startsWith(query);

        case "phone":
          return customer.customerPhone.startsWith(query);

        case "count":
          return customer.totalSales.toString().startsWith(query);

        case "sales":
          return customer.totalAmount.toString().startsWith(query);

        case "balance":
          return customer.currentBalance.toString().startsWith(query) ||
                 Math.abs(customer.currentBalance).toString().startsWith(query);

        case "all":
        default:
          // Search in all fields (from start)
          return (
            customer.customerName.toLowerCase().startsWith(query) ||
            customer.customerPhone.startsWith(query) ||
            customer.totalSales.toString().startsWith(query) ||
            customer.totalAmount.toString().startsWith(query) ||
            customer.currentBalance.toString().startsWith(query) ||
            Math.abs(customer.currentBalance).toString().startsWith(query)
          );
      }
    });
  }, [customerReports, searchQuery, searchType]);

  const handleDeleteCustomer = async (customerId: string, customerName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete

    if (!user) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف العميل "${customerName}"؟\nسيتم حذف جميع الفواتير المرتبطة بهذا العميل أيضاً.`
    );

    if (!confirmed) return;

    try {
      setDeletingCustomerId(customerId);
      await deleteCustomer(customerId, user.uid);
    } catch (error: any) {
      alert(error.message || "فشل في حذف العميل");
    } finally {
      setDeletingCustomerId(null);
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
            <h1 className="text-3xl font-bold text-slate-900">تقارير العملاء</h1>
            <p className="text-slate-600 mt-1">عرض جميع العملاء وحساباتهم (المدين/الدائن)</p>
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
                  {searchType === "name" && "اسم العميل"}
                  {searchType === "phone" && "رقم الهاتف"}
                  {searchType === "count" && "عدد الفواتير"}
                  {searchType === "sales" && "إجمالي المبيعات"}
                  {searchType === "balance" && "الرصيد الحالي"}
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
                  اسم العميل
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSearchType("phone")}
                  className={`cursor-pointer ${searchType === "phone" ? "bg-slate-100" : ""}`}
                >
                  رقم الهاتف
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSearchType("count")}
                  className={`cursor-pointer ${searchType === "count" ? "bg-slate-100" : ""}`}
                >
                  عدد الفواتير
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSearchType("sales")}
                  className={`cursor-pointer ${searchType === "sales" ? "bg-slate-100" : ""}`}
                >
                  إجمالي المبيعات
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSearchType("balance")}
                  className={`cursor-pointer ${searchType === "balance" ? "bg-slate-100" : ""}`}
                >
                  الرصيد الحالي
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
                    ? "بحث عن عميل، رقم الهاتف، الفواتير، المبيعات أو الرصيد..."
                    : searchType === "name"
                    ? "بحث عن اسم العميل..."
                    : searchType === "phone"
                    ? "بحث عن رقم الهاتف..."
                    : searchType === "count"
                    ? "بحث عن عدد الفواتير..."
                    : searchType === "sales"
                    ? "بحث عن إجمالي المبيعات..."
                    : "بحث عن الرصيد الحالي..."
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

      {/* Customers Table */}
      {customerReports.length === 0 ? (
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-slate-500 text-lg">لا يوجد عملاء بعد</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
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
                    اسم العميل
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                    رقم الهاتف
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">
                    عدد الفواتير
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                    إجمالي المبيعات
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    الرصيد الحالي
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.customerId}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td
                      className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-medium text-slate-900 cursor-pointer"
                      onClick={() => router.push(`/reports/customers/${customer.customerId}`)}
                    >
                      {index + 1}
                    </td>
                    <td
                      className="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-slate-900 cursor-pointer"
                      onClick={() => router.push(`/reports/customers/${customer.customerId}`)}
                    >
                      {customer.customerName}
                    </td>
                    <td
                      className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden md:table-cell cursor-pointer"
                      onClick={() => router.push(`/reports/customers/${customer.customerId}`)}
                    >
                      {customer.customerPhone}
                    </td>
                    <td
                      className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden sm:table-cell cursor-pointer"
                      onClick={() => router.push(`/reports/customers/${customer.customerId}`)}
                    >
                      {customer.totalSales}
                    </td>
                    <td
                      className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden lg:table-cell cursor-pointer"
                      onClick={() => router.push(`/reports/customers/${customer.customerId}`)}
                    >
                      {customer.totalAmount.toFixed(2)} ج.م
                    </td>
                    <td
                      className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm cursor-pointer"
                      onClick={() => router.push(`/reports/customers/${customer.customerId}`)}
                    >
                      <span
                        className={`font-semibold ${
                          customer.currentBalance > 0
                            ? "text-red-600"
                            : customer.currentBalance < 0
                            ? "text-blue-600"
                            : "text-green-600"
                        }`}
                      >
                        {customer.currentBalance > 0
                          ? `${customer.currentBalance.toFixed(2)} ج.م (مدين)`
                          : customer.currentBalance < 0
                          ? `${Math.abs(customer.currentBalance).toFixed(2)} ج.م (دائن)`
                          : "صفر (متعادل)"}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => handleDeleteCustomer(customer.customerId, customer.customerName, e)}
                        disabled={deletingCustomerId === customer.customerId}
                      >
                        {deletingCustomerId === customer.customerId ? (
                          <span className="flex items-center gap-2">
                            <div className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                            جاري الحذف...
                          </span>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 ml-1"
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
                            حذف
                          </>
                        )}
                      </Button>
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
