"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { usePurchasesStore } from "@/features/purchases/store/purchases-store";
import { useSuppliersStore } from "@/features/suppliers/store/suppliers-store";

export default function SupplierPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { purchases, fetchPurchases } = usePurchasesStore();
  const { suppliers, fetchSuppliers, recordPayment, createSupplier } = useSuppliersStore();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supplierName = searchParams.get("name") || "";

  useEffect(() => {
    if (user) {
      fetchPurchases(user.uid);
      fetchSuppliers(user.uid);
    }
  }, [user, fetchPurchases, fetchSuppliers]);

  // Find the supplier or get data from purchases
  const supplier = useMemo(() => {
    return suppliers.find((s) => s.name === supplierName);
  }, [suppliers, supplierName]);

  // Filter purchases by supplier
  const supplierPurchases = useMemo(() => {
    return purchases.filter((p) => p.supplierName === supplierName);
  }, [purchases, supplierName]);

  // Get supplier phone from purchases
  const supplierPhone = useMemo(() => {
    if (supplierPurchases.length > 0) {
      return supplierPurchases[0].supplierPhone;
    }
    return "";
  }, [supplierPurchases]);

  // Calculate totals
  const totals = useMemo(() => {
    return supplierPurchases.reduce(
      (acc, purchase) => {
        return {
          totalAmount: acc.totalAmount + purchase.purchasePrice,
          totalQuantity: acc.totalQuantity + purchase.quantity,
        };
      },
      { totalAmount: 0, totalQuantity: 0 }
    );
  }, [supplierPurchases]);

  const currentBalance = supplier?.totalBalance || totals.totalAmount;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("الرجاء إدخال مبلغ صحيح");
      return;
    }

    if (amount > currentBalance) {
      alert("المبلغ المدخل أكبر من الرصيد المستحق");
      return;
    }

    setIsSubmitting(true);
    try {
      let supplierId = supplier?.id;

      // If supplier doesn't exist, create it
      if (!supplierId) {
        supplierId = await createSupplier({
          name: supplierName,
          phone: supplierPhone,
          totalBalance: currentBalance,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: user.uid,
        });
      }

      const previousBalance = currentBalance;
      const newBalance = previousBalance - amount;

      await recordPayment({
        supplierId,
        supplierName,
        paymentAmount: amount,
        previousBalance,
        currentBalance: newBalance,
        userId: user.uid,
      });

      alert("تم تسجيل الدفعة بنجاح");
      router.push("/reports/suppliers");
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("حدث خطأ أثناء تسجيل الدفعة");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (supplierPurchases.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-600">لا توجد مشتريات من هذا المورد</p>
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

        <h1 className="text-3xl font-bold text-slate-900">تسديد مبلغ للمورد</h1>
        <p className="text-slate-600 mt-1">{supplierName}</p>
      </div>

      {/* Supplier Balance Card */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg border-2 border-red-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600 mb-1">إجمالي المستحقات الحالية</p>
            <p className="text-3xl font-bold text-red-600">
              {currentBalance.toFixed(2)} ج.م
            </p>
          </div>
          <div className="p-4 bg-red-100 rounded-full">
            <svg
              className="w-8 h-8 text-red-600"
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

      {/* Purchases Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">عدد المشتريات</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {supplierPurchases.length}
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

        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">إجمالي المشتريات</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {totals.totalAmount.toFixed(2)} ج.م
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
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg border border-slate-200 mb-6" dir="rtl">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            تفاصيل المشتريات من {supplierName}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  #
                </th>
                <th className="text-right px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  اسم المنتج
                </th>
                <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  الكمية
                </th>
                <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                  سعر الوحدة
                </th>
                <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  الإجمالي
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {supplierPurchases.map((purchase, index) => (
                <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-medium text-slate-900">
                    {index + 1}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-semibold text-slate-900">
                    {purchase.productName}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900">
                    {purchase.quantity}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden md:table-cell">
                    {purchase.unitPurchasePrice.toFixed(2)} ج.م
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-semibold text-green-600">
                    {purchase.purchasePrice.toFixed(2)} ج.م
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td
                  colSpan={4}
                  className="px-3 md:px-6 py-3 md:py-4 text-right text-sm font-bold text-slate-900"
                >
                  الإجمالي
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-center text-sm font-bold text-green-600">
                  {totals.totalAmount.toFixed(2)} ج.م
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-lg border border-slate-200 p-6" dir="rtl">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          تسجيل دفعة جديدة
        </h2>
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              المبلغ المدفوع (ج.م)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={currentBalance}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="أدخل المبلغ المدفوع"
              required
              className="text-right"
              dir="rtl"
            />
            <p className="text-xs text-slate-500 mt-1">
              الحد الأقصى: {currentBalance.toFixed(2)} ج.م
            </p>
          </div>

          {paymentAmount && !isNaN(parseFloat(paymentAmount)) && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-700">
                <span className="font-semibold">الرصيد السابق:</span>{" "}
                {currentBalance.toFixed(2)} ج.م
              </p>
              <p className="text-sm text-slate-700 mt-1">
                <span className="font-semibold">المبلغ المدفوع:</span>{" "}
                {parseFloat(paymentAmount).toFixed(2)} ج.م
              </p>
              <p className="text-sm text-green-700 font-semibold mt-1">
                <span>الرصيد الجديد:</span>{" "}
                {(currentBalance - parseFloat(paymentAmount)).toFixed(2)} ج.م
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || !paymentAmount}
              className="flex-1"
            >
              {isSubmitting ? "جاري التسجيل..." : "تسجيل الدفعة"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/reports/suppliers")}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
