"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useSalesStore } from "@/features/sales/store/sales-store";
import { useReactToPrint } from "react-to-print";
import { InvoiceHeader } from "@/components/common/InvoiceHeader";
import { InvoiceFooter } from "@/components/common/InvoiceFooter";

export default function CustomerStatementPage() {
  const router = useRouter();
  const params = useParams();
  const statementRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { sales, customers, fetchSales, fetchCustomers, receipts, fetchCustomerReceipts } = useSalesStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const customerId = params.id as string;

  useEffect(() => {
    if (user) {
      fetchSales(user.uid);
      fetchCustomers(user.uid);
    }
  }, [user, fetchSales, fetchCustomers]);

  useEffect(() => {
    if (customerId) {
      fetchCustomerReceipts(customerId);
    }
  }, [customerId, fetchCustomerReceipts]);

  const customer = useMemo(() => {
    return customers.find((c) => c.id === customerId);
  }, [customers, customerId]);

  // Get all sales for this customer and prepare account statement
  const accountStatement = useMemo(() => {
    // Combine sales and receipts
    const allTransactions: any[] = [];

    // Add sales transactions
    sales
      .filter((s) => s.customerId === customerId)
      .forEach((sale) => {
        allTransactions.push({
          id: sale.id,
          date: sale.createdAt instanceof Date ? sale.createdAt : new Date(sale.createdAt),
          invoiceNumber: sale.invoiceNumber,
          description: sale.invoiceType === "payment"
            ? `دفعة نقدية`
            : `فاتورة بيع - إجمالي: ${sale.totalAmount.toFixed(2)} ج.م`,
          debit: sale.invoiceType === "payment" ? 0 : sale.currentBalance,
          credit: sale.invoiceType === "payment" ? Math.abs(sale.totalAmount) : 0,
          type: 'sale',
        });
      });

    // Add receipt transactions
    receipts
      .filter((r) => r.customerId === customerId)
      .forEach((receipt) => {
        allTransactions.push({
          id: receipt.id,
          date: receipt.receiptDate instanceof Date ? receipt.receiptDate : new Date(receipt.receiptDate),
          invoiceNumber: receipt.receiptNumber,
          description: `إيصال استلام نقدي`,
          debit: 0,
          credit: receipt.paidAmount,
          type: 'receipt',
        });
      });

    // Sort all transactions by date
    allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate running balance
    let runningBalance = 0;
    const transactions = allTransactions.map((transaction) => {
      runningBalance = runningBalance + transaction.debit - transaction.credit;
      return {
        ...transaction,
        balance: runningBalance,
      };
    });

    return transactions;
  }, [sales, receipts, customerId]);

  // Get all items purchased by customer
  const allItems = useMemo(() => {
    const customerSales = sales
      .filter((s) => s.customerId === customerId && s.invoiceType !== "payment")
      .sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return dateA.getTime() - dateB.getTime();
      });

    const items: Array<{
      invoiceNumber: string;
      date: Date;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    customerSales.forEach((sale) => {
      sale.items.forEach((item) => {
        items.push({
          invoiceNumber: sale.invoiceNumber,
          date: sale.createdAt,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        });
      });
    });

    return items;
  }, [sales, customerId]);

  const totals = useMemo(() => {
    return accountStatement.reduce(
      (acc, trans) => ({
        totalDebit: acc.totalDebit + trans.debit,
        totalCredit: acc.totalCredit + trans.credit,
      }),
      { totalDebit: 0, totalCredit: 0 }
    );
  }, [accountStatement]);

  const handlePrint = useReactToPrint({
    contentRef: statementRef,
    documentTitle: `كشف-حساب-${customer?.name || 'customer'}-${format(new Date(), 'dd-MM-yyyy')}`,
    onBeforePrint: async () => {
      setIsDownloading(true);
    },
    onAfterPrint: () => {
      setIsDownloading(false);
    },
  });

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:p-0 print:bg-white print:min-h-0">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons - Hidden on Print */}
        <div className="flex flex-wrap gap-3 mb-6 print:hidden">
          <Button
            variant="outline"
            onClick={() => router.push(`/reports/customers/${customerId}`)}
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
            رجوع
          </Button>
          <Button
            onClick={handlePrint}
            disabled={isDownloading}
            className="bg-green-600 hover:bg-green-700"
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
            {isDownloading ? "جاري الطباعة..." : "طباعة كشف الحساب (PDF)"}
          </Button>
        </div>

        {/* Statement */}
        <div
          id="statement-print-area"
          ref={statementRef}
          className="bg-white shadow-2xl rounded-xl overflow-hidden border border-slate-200 print:shadow-none print:border-0 print:rounded-none"
          style={{
            width: "210mm",
            margin: "0 auto",
            padding: "15mm",
          }}
          dir="rtl"
        >
          {/* Header */}
          <InvoiceHeader
            title="كشف حساب عميل"
            subtitle={customer ? `العميل: ${customer.name}` : ''}
            date={new Date()}
          />

          {/* Customer Info */}
          <div className="mb-10 bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-2xl border-2 border-slate-200 shadow-md" dir="rtl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                بيانات العميل
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-slate-600">الاسم:</span>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {customer.name}
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-slate-600">رقم الهاتف:</span>
                </div>
                <p className="text-xl font-bold text-slate-900 tracking-wider">
                  {customer.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Items Purchased Table */}
          <div className="mb-12" dir="rtl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-xl">
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
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                المنتجات المشتراة
              </h2>
            </div>
            {allItems.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                <svg
                  className="w-16 h-16 text-slate-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-slate-500 text-lg font-medium">لا توجد منتجات مشتراة</p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border-2 border-slate-200 shadow-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-600 to-green-500 text-white">
                      <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                        #
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                        التاريخ
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                        رقم الفاتورة
                      </th>
                      <th className="px-4 py-4 text-right text-sm font-bold tracking-wide">
                        اسم المنتج
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                        الكمية
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                        سعر الوحدة
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                        الإجمالي
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allItems.map((item, index) => (
                      <tr
                        key={`${item.invoiceNumber}-${index}`}
                        className={`border-b border-slate-200 transition-colors ${
                          index % 2 === 0 ? "bg-white hover:bg-green-50" : "bg-slate-50 hover:bg-green-50"
                        }`}
                      >
                        <td className="px-4 py-3 text-center text-xs font-medium text-slate-700">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-600">
                          {format(item.date, "dd/MM/yyyy", { locale: ar })}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-semibold text-blue-600">
                          {item.invoiceNumber}
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold text-slate-900">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-semibold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-700">
                          {item.unitPrice.toFixed(2)} ج.م
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-green-600">
                          {item.totalPrice.toFixed(2)} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gradient-to-r from-slate-700 to-slate-600 text-white font-bold">
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-right text-xs"
                      >
                        الإجمالي الكلي
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {allItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        -
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-extrabold">
                        {allItems
                          .reduce((sum, item) => sum + item.totalPrice, 0)
                          .toFixed(2)}{" "}
                        ج.م
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Account Statement Table */}
          <div className="mb-12" dir="rtl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
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
              <h2 className="text-2xl font-bold text-slate-900">
                كشف الحساب
              </h2>
            </div>
            <div className="rounded-xl overflow-hidden border-2 border-slate-200 shadow-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                    <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                      التاريخ
                    </th>
                    <th className="px-4 py-4 text-right text-sm font-bold tracking-wide">
                      البيان
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                      مدين
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                      دائن
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-bold tracking-wide">
                      الرصيد
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accountStatement.map((transaction, index) => (
                    <tr
                      key={transaction.id}
                      className={`border-b border-slate-200 transition-colors ${
                        index % 2 === 0 ? "bg-white hover:bg-blue-50" : "bg-slate-50 hover:bg-blue-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-center text-xs text-slate-600">
                        {format(transaction.date, "dd/MM/yyyy", { locale: ar })}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-900">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold">
                        {transaction.debit > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-red-100 text-red-700">
                            {transaction.debit.toFixed(2)} ج.م
                          </span>
                        ) : (
                          <span className="text-slate-300 text-lg">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold">
                        {transaction.credit > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-100 text-green-700">
                            {transaction.credit.toFixed(2)} ج.م
                          </span>
                        ) : (
                          <span className="text-slate-300 text-lg">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-extrabold">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-lg ${
                            transaction.balance > 0
                              ? "bg-red-100 text-red-700"
                              : transaction.balance < 0
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {transaction.balance.toFixed(2)} ج.م
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-slate-700 to-slate-600 text-white font-bold">
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-right text-xs"
                    >
                      الإجمالي النهائي
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-red-200 text-red-900">
                        {totals.totalDebit.toFixed(2)} ج.م
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-200 text-green-900">
                        {totals.totalCredit.toFixed(2)} ج.م
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-extrabold">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg ${
                          customer.totalBalance > 0
                            ? "bg-red-200 text-red-900"
                            : customer.totalBalance < 0
                            ? "bg-blue-200 text-blue-900"
                            : "bg-green-200 text-green-900"
                        }`}
                      >
                        {customer.totalBalance.toFixed(2)} ج.م
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-10 bg-gradient-to-br from-slate-100 to-slate-200 p-8 rounded-2xl border-2 border-slate-300 shadow-lg" dir="rtl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
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
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                الملخص المالي
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-2xl border-2 border-red-200 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-red-100 rounded-xl">
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
                        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-600 mb-2">إجمالي المدين</p>
                <p className="text-2xl font-extrabold text-red-600">
                  {totals.totalDebit.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">جنيه مصري</p>
              </div>

              <div className="text-center p-6 bg-white rounded-2xl border-2 border-green-200 shadow-md hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-3 bg-green-100 rounded-xl">
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
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-600 mb-2">إجمالي الدائن</p>
                <p className="text-2xl font-extrabold text-green-600">
                  {totals.totalCredit.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">جنيه مصري</p>
              </div>

              <div className={`text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow ${
                customer.totalBalance > 0
                  ? "border-2 border-red-300"
                  : customer.totalBalance < 0
                  ? "border-2 border-blue-300"
                  : "border-2 border-green-300"
              }`}>
                <div className="flex items-center justify-center mb-3">
                  <div className={`p-3 rounded-xl ${
                    customer.totalBalance > 0
                      ? "bg-red-100"
                      : customer.totalBalance < 0
                      ? "bg-blue-100"
                      : "bg-green-100"
                  }`}>
                    <svg
                      className={`w-6 h-6 ${
                        customer.totalBalance > 0
                          ? "text-red-600"
                          : customer.totalBalance < 0
                          ? "text-blue-600"
                          : "text-green-600"
                      }`}
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
                <p className="text-xs font-medium text-slate-600 mb-2">الرصيد النهائي</p>
                <p
                  className={`text-2xl font-extrabold ${
                    customer.totalBalance > 0
                      ? "text-red-600"
                      : customer.totalBalance < 0
                      ? "text-blue-600"
                      : "text-green-600"
                  }`}
                >
                  {customer.totalBalance.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">جنيه مصري</p>
              </div>
            </div>
          </div>

          {/* Footer */}
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

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Hide everything first */
          body > * {
            display: none !important;
          }

          /* Show only the main container */
          body > #__next {
            display: block !important;
          }

          #__next > * {
            display: none !important;
          }

          /* Find and show the statement area */
          #statement-print-area {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
          }

          #statement-print-area,
          #statement-print-area * {
            visibility: visible !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          img {
            max-width: 100% !important;
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
