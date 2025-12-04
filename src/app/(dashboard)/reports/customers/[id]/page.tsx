"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useSalesStore } from "@/features/sales/store/sales-store";
import { INVOICE_TYPE_LABELS } from "@/features/sales/types";

export default function CustomerAccountPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const { sales, customers, isLoading, fetchSales, fetchCustomers, addPaymentToCustomer } =
    useSalesStore();

  const customerId = params.id as string;

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { receipts, fetchCustomerReceipts } = useSalesStore();

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
          invoiceType: sale.invoiceType,
        });
      });

    // Add receipt transactions - filter for this customer only
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
          invoiceType: 'receipt',
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

  // Calculate totals
  const totals = useMemo(() => {
    return accountStatement.reduce(
      (acc, trans) => ({
        totalDebit: acc.totalDebit + trans.debit,
        totalCredit: acc.totalCredit + trans.credit,
      }),
      { totalDebit: 0, totalCredit: 0 }
    );
  }, [accountStatement]);

  const handleAddPayment = async () => {
    if (!customer || !user) return;

    if (paymentAmount <= 0) {
      setError("المبلغ يجب أن يكون أكبر من صفر");
      return;
    }

    if (paymentAmount > customer.totalBalance) {
      setError("المبلغ المدفوع أكبر من الرصيد الحالي");
      return;
    }

    try {
      setIsAddingPayment(true);
      setError(null);
      await addPaymentToCustomer(customerId, paymentAmount);
      setPaymentAmount(0);
    } catch (err: any) {
      setError(err.message || "فشل في إضافة الدفعة");
    } finally {
      setIsAddingPayment(false);
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

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-600">العميل غير موجود</p>
          <Button onClick={() => router.push("/reports/customers")} className="mt-4">
            رجوع إلى تقارير العملاء
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/reports/customers")}
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
            رجوع إلى تقارير العملاء
          </Button>
          <Button
            onClick={() => router.push(`/reports/customers/${customerId}/statement`)}
            className="bg-blue-600 hover:bg-blue-700"
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
            طباعة كشف الحساب (PDF)
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{customer.name}</h1>
            <p className="text-slate-600 mt-1">رقم الهاتف: {customer.phone}</p>
          </div>
          <Button
            onClick={() => router.push(`/reports/customers/${customerId}/add-receipt`)}
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            إيصال استلام
          </Button>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Balance Card */}
        <div className="bg-white p-6 rounded-lg border-2 border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">ملخص الحساب</h2>

          <div className="space-y-3">
            {/* Total Debit */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">إجمالي المدين:</span>
              <span className="text-lg font-bold text-red-600">
                {totals.totalDebit.toFixed(2)} ج.م
              </span>
            </div>

            {/* Total Credit */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-sm text-slate-600">إجمالي الدائن:</span>
              <span className="text-lg font-bold text-green-600">
                {totals.totalCredit.toFixed(2)} ج.م
              </span>
            </div>

            {/* Current Balance */}
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded mt-2">
              <span className="text-base font-bold text-slate-900">الرصيد الحالي:</span>
              <span
                className={`text-2xl font-bold ${
                  customer.totalBalance > 0
                    ? "text-red-600"
                    : customer.totalBalance < 0
                    ? "text-blue-600"
                    : "text-green-600"
                }`}
              >
                {customer.totalBalance.toFixed(2)} ج.م
              </span>
            </div>
          </div>
        </div>

        {/* Add Payment Card */}
        {customer.totalBalance > 0 && (
          <div className="bg-white p-6 rounded-lg border-2 border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">إضافة دفعة</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="payment">مبلغ الدفعة</Label>
                <Input
                  id="payment"
                  type="number"
                  min="0"
                  max={customer.totalBalance}
                  step="0.01"
                  value={paymentAmount || ""}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  placeholder="أدخل المبلغ المدفوع"
                />
                <p className="text-xs text-slate-500 mt-1">
                  الحد الأقصى: {customer.totalBalance.toFixed(2)} ج.م
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Button
                onClick={handleAddPayment}
                disabled={isAddingPayment || paymentAmount <= 0}
                className="w-full"
              >
                {isAddingPayment ? "جاري الحفظ..." : "إضافة الدفعة"}
              </Button>
            </div>
          </div>
        )}

        {customer.totalBalance === 0 && (
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-center">
              <svg
                className="w-12 h-12 text-green-600 ml-2"
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
              <span className="text-xl font-bold text-green-700">الحساب متعادل</span>
            </div>
          </div>
        )}
      </div>

      {/* Receipts Table */}
      {receipts.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 mb-6">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">إيصالات الاستلام</h2>
            <p className="text-sm text-slate-600">جميع إيصالات الاستلام النقدي</p>
          </div>

          <div className="overflow-x-auto" dir="rtl">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    رقم الإيصال
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    المبلغ
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                    الرصيد السابق
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                    الرصيد الحالي
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900">
                      {format(receipt.receiptDate, "dd/MM/yyyy", { locale: ar })}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-semibold text-slate-900">
                      {receipt.receiptNumber}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-semibold text-green-600">
                      {receipt.paidAmount.toFixed(2)} ج.م
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden md:table-cell">
                      {receipt.previousBalance.toFixed(2)} ج.م
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden md:table-cell">
                      {receipt.currentBalance.toFixed(2)} ج.م
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/reports/customers/${customerId}/receipt/${receipt.id}`
                          )
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        عرض
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Account Statement Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">كشف حساب العميل</h2>
          <p className="text-sm text-slate-600">جميع العمليات المالية</p>
        </div>

        {accountStatement.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">لا توجد عمليات لهذا العميل</p>
          </div>
        ) : (
          <div className="overflow-x-auto" dir="rtl">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">
                    التاريخ
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                    رقم الفاتورة
                  </th>
                  <th className="text-right px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    البيان
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    مدين
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    دائن
                  </th>
                  <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    الرصيد
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {accountStatement.map((transaction) => (
                  <tr
                    key={transaction.id}
                    onClick={() =>
                      transaction.type === "sale" && transaction.invoiceType !== "payment" &&
                      router.push(`/sales/${transaction.id}`)
                    }
                    className={`hover:bg-slate-50 transition-colors ${
                      transaction.type === "sale" && transaction.invoiceType !== "payment" ? "cursor-pointer" : ""
                    }`}
                  >
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden sm:table-cell">
                      {format(transaction.date, "dd/MM/yyyy", { locale: ar })}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden lg:table-cell">
                      {transaction.invoiceNumber}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm text-slate-900">
                      {transaction.description}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-semibold">
                      {transaction.debit > 0 ? (
                        <span className="text-red-600">
                          {transaction.debit.toFixed(2)} ج.م
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-semibold">
                      {transaction.credit > 0 ? (
                        <span className="text-green-600">
                          {transaction.credit.toFixed(2)} ج.م
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-bold">
                      <span
                        className={
                          transaction.balance > 0
                            ? "text-red-600"
                            : transaction.balance < 0
                            ? "text-blue-600"
                            : "text-green-600"
                        }
                      >
                        {transaction.balance.toFixed(2)} ج.م
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals Row */}
              <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 md:px-6 py-3 md:py-4 text-right text-sm font-bold text-slate-900"
                  >
                    الإجمالي
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-sm font-bold text-red-600">
                    {totals.totalDebit.toFixed(2)} ج.م
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-sm font-bold text-green-600">
                    {totals.totalCredit.toFixed(2)} ج.م
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-sm font-bold">
                    <span
                      className={
                        customer.totalBalance > 0
                          ? "text-red-600"
                          : customer.totalBalance < 0
                          ? "text-blue-600"
                          : "text-green-600"
                      }
                    >
                      {customer.totalBalance.toFixed(2)} ج.م
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
