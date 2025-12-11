"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { usePurchasesStore } from "@/features/purchases/store/purchases-store";
import { useSuppliersStore } from "@/features/suppliers/store/suppliers-store";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";
import { SupplierStatement } from "@/features/suppliers/types";
import { useReactToPrint } from "react-to-print";
import { InvoiceHeader } from "@/components/common/InvoiceHeader";
import { InvoiceFooter } from "@/components/common/InvoiceFooter";

export default function SupplierStatementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statementRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { currentTenant } = useTenantsStore();
  const { purchases, fetchPurchases } = usePurchasesStore();
  const {
    suppliers,
    payments,
    fetchSuppliers,
    fetchAllPayments,
  } = useSuppliersStore();
  const [isPrinting, setIsPrinting] = useState(false);

  const supplierName = searchParams.get("name") || "";

  useEffect(() => {
    if (user && currentTenant) {
      fetchPurchases(user.uid);
      fetchSuppliers(user.uid);
      fetchAllPayments(user.uid);
    }
  }, [user, currentTenant, fetchPurchases, fetchSuppliers, fetchAllPayments]);

  // Find the supplier
  const supplier = useMemo(() => {
    return suppliers.find((s) => s.name === supplierName);
  }, [suppliers, supplierName]);

  // Get supplier purchases
  const supplierPurchases = useMemo(() => {
    return purchases.filter((p) => p.supplierName === supplierName);
  }, [purchases, supplierName]);

  // Get supplier payments
  const supplierPayments = useMemo(() => {
    return payments.filter((p) => p.supplierName === supplierName);
  }, [payments, supplierName]);

  // Build statement combining purchases (debit) and payments (credit)
  const statement = useMemo((): SupplierStatement[] => {
    const items: SupplierStatement[] = [];

    // Add purchases as debit
    supplierPurchases.forEach((purchase) => {
      items.push({
        id: purchase.id,
        date: purchase.createdAt,
        description: `شراء ${purchase.productName} - كمية ${purchase.quantity}`,
        debit: purchase.purchasePrice,
        credit: 0,
        balance: 0,
        type: "purchase",
      });
    });

    // Add payments as credit
    supplierPayments.forEach((payment) => {
      items.push({
        id: payment.id,
        date: payment.paymentDate,
        description: "دفعة مستحقات",
        debit: 0,
        credit: payment.paymentAmount,
        balance: 0,
        type: "payment",
      });
    });

    // Sort by date (oldest first)
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate balance for each row:
    // - For purchases (debit): show only that row's amount
    // - For payments (credit): show remaining balance after payment (cumulative up to that point)
    let runningBalance = 0;
    items.forEach((item) => {
      runningBalance += item.debit - item.credit;
      if (item.type === "payment") {
        // For payments, show the remaining balance after this payment
        item.balance = runningBalance;
      } else {
        // For purchases, show only this row's debit amount
        item.balance = item.debit;
      }
    });

    return items;
  }, [supplierPurchases, supplierPayments]);

  // Calculate totals
  const totals = useMemo(() => {
    return statement.reduce(
      (acc, item) => ({
        totalDebit: acc.totalDebit + item.debit,
        totalCredit: acc.totalCredit + item.credit,
      }),
      { totalDebit: 0, totalCredit: 0 }
    );
  }, [statement]);

  // Total balance = Total Debit - Total Credit
  const currentBalance = totals.totalDebit - totals.totalCredit;

  const handlePrint = useReactToPrint({
    contentRef: statementRef,
    documentTitle: `كشف-حساب-مورد-${supplierName}-${format(new Date(), 'dd-MM-yyyy')}`,
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
  });

  if (!supplierName) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-600">اسم المورد غير محدد</p>
          <Button onClick={() => router.push("/reports/suppliers")} className="mt-4">
            رجوع للموردين
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/reports/suppliers")}
          className="mb-4"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          رجوع إلى الموردين
        </Button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{supplierName}</h1>
            <p className="text-slate-600 mt-1">كشف حساب المورد</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
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
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              {isPrinting ? "جاري الطباعة..." : "طباعة كشف الحساب"}
            </Button>
            <Button onClick={() => router.push(`/reports/suppliers/payment?name=${encodeURIComponent(supplierName)}`)}>
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
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              تسديد مبلغ
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Statement */}
      <div
        id="supplier-statement-print-area"
        ref={statementRef}
        className="bg-white rounded-lg shadow-sm print:shadow-none print:rounded-none"
        dir="rtl"
      >
        {/* Print Header - Hidden on screen */}
        <div className="hidden print:block">
          <InvoiceHeader
            title="كشف حساب مورد"
            subtitle={`المورد: ${supplierName}`}
            date={new Date()}
          />
        </div>

        {/* Supplier Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 print:p-2">
          {/* Total Debit */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">إجمالي المدين</p>
              <p className="text-2xl font-extrabold text-red-600">
                {totals.totalDebit.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1">ج.م</p>
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Credit */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">إجمالي الدائن</p>
              <p className="text-2xl font-extrabold text-green-600">
                {totals.totalCredit.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1">ج.م</p>
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">الرصيد الحالي</p>
              <p className="text-2xl font-extrabold text-orange-600">
                {currentBalance.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1">ج.م</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg
                className="w-6 h-6 text-orange-600"
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
        </div>

        {/* Statement Table */}
        {statement.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <p className="text-slate-500 text-lg">لا توجد معاملات مع هذا المورد</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200" dir="rtl">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">كشف الحساب</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="text-center px-3 md:px-4 py-3 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-center px-3 md:px-4 py-3 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                    التاريخ
                  </th>
                  <th className="text-right px-3 md:px-4 py-3 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    البيان
                  </th>
                  <th className="text-center px-3 md:px-4 py-3 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    مدين
                  </th>
                  <th className="text-center px-3 md:px-4 py-3 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    دائن
                  </th>
                  <th className="text-center px-3 md:px-4 py-3 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    الرصيد
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {statement.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      item.type === "purchase" ? "bg-red-50/30" : "bg-green-50/30"
                    }`}
                  >
                    <td className="px-3 md:px-4 py-3 text-center text-xs md:text-sm font-medium text-slate-700">
                      {index + 1}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-center text-xs md:text-sm text-slate-700 hidden md:table-cell">
                      {format(item.date, "dd/MM/yyyy", { locale: ar })}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-right text-xs md:text-sm text-slate-900">
                      {item.description}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-red-600">
                      {item.debit > 0 ? item.debit.toFixed(2) : "-"}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-center text-xs md:text-sm font-semibold text-green-600">
                      {item.credit > 0 ? item.credit.toFixed(2) : "-"}
                    </td>
                    <td className="px-3 md:px-4 py-3 text-center text-xs md:text-sm font-bold text-orange-600">
                      {item.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gradient-to-r from-slate-100 to-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 md:px-4 py-3 text-right text-xs md:text-sm font-bold text-slate-900"
                  >
                    الإجمالي
                  </td>
                  <td className="px-3 md:px-4 py-3 text-center text-xs md:text-sm font-bold text-red-600">
                    {totals.totalDebit.toFixed(2)}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-center text-xs md:text-sm font-bold text-green-600">
                    {totals.totalCredit.toFixed(2)}
                  </td>
                  <td className="px-3 md:px-4 py-3 text-center text-xs md:text-sm font-bold text-orange-600">
                    {currentBalance.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          </div>
        )}

        {/* Footer with WhatsApp QR Code */}
        <div className="p-4 mt-6">
          <InvoiceFooter />
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          body * {
            visibility: hidden;
          }

          #supplier-statement-print-area,
          #supplier-statement-print-area * {
            visibility: visible;
          }

          #supplier-statement-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 10mm !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          @page {
            size: A4;
            margin: 5mm;
          }
        }
      `}</style>
    </div>
  );
}
