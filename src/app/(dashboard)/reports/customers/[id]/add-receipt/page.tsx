"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useSalesStore } from "@/features/sales/store/sales-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Loader2 } from "lucide-react";

export default function AddReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const { user } = useAuthStore();
  const {
    customers,
    fetchCustomers,
    createReceipt,
    generateReceiptNumber,
    isLoading,
  } = useSalesStore();

  const [receiptNumber, setReceiptNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    if (user?.uid) {
      fetchCustomers(user.uid);
    }
  }, [user, fetchCustomers]);

  useEffect(() => {
    if (customerId && customers.length > 0) {
      const foundCustomer = customers.find((c) => c.id === customerId);
      setCustomer(foundCustomer || null);
    }
  }, [customerId, customers]);

  useEffect(() => {
    if (user?.uid) {
      generateReceiptNumber(user.uid).then(setReceiptNumber);
    }
  }, [user, generateReceiptNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer || !user?.uid) return;

    const payment = parseFloat(paidAmount);
    if (isNaN(payment) || payment <= 0) {
      alert("يرجى إدخال مبلغ صحيح");
      return;
    }

    try {
      const receiptData: any = {
        receiptNumber,
        customerId: customer.id,
        customerName: customer.name,
        paidAmount: payment,
        previousBalance: customer.totalBalance,
        currentBalance: customer.totalBalance - payment,
        receiptDate: new Date(),
        userId: user.uid,
      };

      // Only add notes if it's not empty
      if (notes.trim()) {
        receiptData.notes = notes.trim();
      }

      await createReceipt(receiptData, user.uid);
      router.push(`/reports/customers/${customerId}`);
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء إنشاء الإيصال");
    }
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  const currentBalance = customer.totalBalance - (parseFloat(paidAmount) || 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 text-slate-600 hover:text-slate-900"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          رجوع
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          إيصال استلام نقدي
        </h1>
        <p className="text-slate-600 mt-2">إضافة إيصال استلام جديد</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Receipt Number */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="receiptNumber">رقم الإيصال</Label>
            <Input
              id="receiptNumber"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              required
              className="text-right"
              disabled
            />
          </div>

          <div>
            <Label htmlFor="customerName">اسم العميل</Label>
            <Input
              id="customerName"
              value={customer.name}
              disabled
              className="text-right bg-slate-50"
            />
          </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>الرصيد السابق</Label>
            <div className="mt-2 p-3 bg-slate-100 rounded-lg text-center">
              <span className="text-lg font-bold text-slate-900">
                {customer.totalBalance.toFixed(2)} جنيه
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="paidAmount">المبلغ المدفوع</Label>
            <Input
              id="paidAmount"
              type="number"
              step="0.01"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              placeholder="0.00"
              required
              className="text-right text-lg font-semibold"
              autoFocus
            />
          </div>

          <div>
            <Label>الرصيد الحالي</Label>
            <div className="mt-2 p-3 bg-green-50 rounded-lg text-center border border-green-200">
              <span className="text-lg font-bold text-green-700">
                {currentBalance.toFixed(2)} جنيه
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">ملاحظات (اختياري)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي ملاحظات إضافية..."
            className="text-right min-h-[100px]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              "حفظ الإيصال"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
