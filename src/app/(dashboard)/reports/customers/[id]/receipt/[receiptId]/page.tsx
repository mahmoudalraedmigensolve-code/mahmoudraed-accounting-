"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useSalesStore } from "@/features/sales/store/sales-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, Printer, Edit, Trash2, MoreVertical, Loader2 } from "lucide-react";
import { CustomerReceipt } from "@/features/sales/types";
import { InvoiceHeader } from "@/components/common/InvoiceHeader";
import { InvoiceFooter } from "@/components/common/InvoiceFooter";

export default function ReceiptViewPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const receiptId = params.receiptId as string;

  const { user } = useAuthStore();
  const { receipts, fetchCustomerReceipts, deleteReceipt, isLoading } =
    useSalesStore();

  const [receipt, setReceipt] = useState<CustomerReceipt | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Add print styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        /* Force print background colors and images */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* Hide everything except receipt */
        body * {
          visibility: hidden;
        }

        #receipt-print-area,
        #receipt-print-area * {
          visibility: visible;
        }

        /* Position receipt properly */
        #receipt-print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 20mm;
        }

        /* Remove page margins and headers/footers */
        @page {
          margin: 0;
          size: A4;
        }

        /* Hide browser print headers/footers */
        body {
          margin: 0;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (customerId) {
      fetchCustomerReceipts(customerId);
    }
  }, [customerId, fetchCustomerReceipts]);

  useEffect(() => {
    if (receiptId && receipts.length > 0) {
      const foundReceipt = receipts.find((r) => r.id === receiptId);
      setReceipt(foundReceipt || null);
    }
  }, [receiptId, receipts]);

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!receipt || !user?.uid) return;

    const confirmed = confirm("هل أنت متأكد من حذف هذا الإيصال؟");
    if (!confirmed) return;

    try {
      await deleteReceipt(receipt.id, customerId, user.uid);
      router.push(`/reports/customers/${customerId}`);
    } catch (error: any) {
      alert(error.message || "فشل في حذف الإيصال");
    }
  };

  if (isLoading || !receipt) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Actions Bar - Hidden when printing */}
      <div className="mb-6 print:hidden flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowRight className="w-4 h-4 ml-2" />
          رجوع
        </Button>

        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 cursor-pointer">
                <Trash2 className="w-4 h-4 ml-2" />
                حذف الإيصال
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Receipt - Printable */}
      <div
        id="receipt-print-area"
        ref={printRef}
        className="bg-white border-2 border-slate-300 rounded-lg overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <InvoiceHeader
          title="إيصال استلام"
          subtitle={`رقم الإيصال: ${receipt?.receiptNumber || ''}`}
          date={receipt?.receiptDate || new Date()}
        />

        {/* Receipt Content */}
        <div className="p-4 md:p-6">
          {/* Customer Info */}
        <div className="mb-4 bg-slate-50 p-3 rounded-lg">
          <p className="text-xs text-slate-600 mb-1">استلمنا من السيد / السادة</p>
          <p className="text-lg font-bold text-slate-900">{receipt.customerName}</p>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <div className="bg-green-50 border border-green-300 rounded-lg p-3">
            <p className="text-xs text-slate-600 mb-1 text-center">المبلغ المستلم</p>
            <p className="text-2xl font-bold text-green-700 text-center">
              {receipt.paidAmount.toFixed(2)} جنيه
            </p>
          </div>
        </div>

        {/* Balance Details */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">الرصيد السابق</p>
            <p className="text-base font-bold text-red-600">
              {receipt.previousBalance.toFixed(2)} ج.م
            </p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">الرصيد الحالي</p>
            <p className="text-base font-bold text-slate-900">
              {receipt.currentBalance.toFixed(2)} ج.م
            </p>
          </div>
        </div>

        {/* Notes */}
        {receipt.notes && (
          <div className="mb-4 bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">ملاحظات</p>
            <p className="text-sm text-slate-900">{receipt.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t border-slate-200">
          <div className="text-center">
            <div className="border-b border-slate-300 pb-2 mb-1 min-h-10"></div>
            <p className="text-xs font-semibold text-slate-700">توقيع المستلم</p>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-300 pb-2 mb-1 min-h-10"></div>
            <p className="text-xs font-semibold text-slate-700">توقيع المحاسب</p>
          </div>
        </div>
        </div>

        {/* Footer */}
        <InvoiceFooter />
      </div>
    </div>
  );
}
