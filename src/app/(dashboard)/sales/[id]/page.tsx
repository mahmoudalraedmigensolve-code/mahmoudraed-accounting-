"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useSalesStore } from "@/features/sales/store/sales-store";
import { INVOICE_TYPE_LABELS } from "@/features/sales/types";
import { useReactToPrint } from "react-to-print";
import { InvoiceHeader } from "@/components/common/InvoiceHeader";
import { InvoiceFooter } from "@/components/common/InvoiceFooter";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { sales, fetchSales } = useSalesStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const saleId = params.id as string;
  const sale = sales.find((s) => s.id === saleId);

  useEffect(() => {
    if (user && sales.length === 0) {
      fetchSales(user.uid);
    }
  }, [user, sales.length, fetchSales]);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `فاتورة-${sale?.invoiceNumber || 'invoice'}`,
    onBeforePrint: async () => {
      setIsDownloading(true);
    },
    onAfterPrint: () => {
      setIsDownloading(false);
    },
  });

  if (!sale) {
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:p-0 print:bg-white print:min-h-0">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons - Hidden on Print */}
        <div className="flex flex-wrap gap-3 mb-6 print:hidden">
          <Button
            variant="outline"
            onClick={() => router.push("/sales")}
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
            رجوع إلى المبيعات
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
            {isDownloading ? "جاري الطباعة..." : "طباعة الفاتورة (PDF)"}
          </Button>
        </div>

        {/* Invoice */}
        <div
          id="invoice-print-area"
          ref={invoiceRef}
          className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none"
          dir="rtl"
          style={{ maxWidth: '210mm' }}
        >
          {/* Invoice Header */}
          <InvoiceHeader
            title="فاتورة بيع"
            subtitle={`رقم الفاتورة: ${sale.invoiceNumber}`}
            date={sale.createdAt}
          />

          {/* Customer & Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border-b border-slate-200 print:grid-cols-2">
            {/* Customer Info */}
            <div className="bg-slate-50 p-4 rounded">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center">
                <svg
                  className="w-4 h-4 ml-1 text-blue-600"
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
                بيانات العميل
              </h2>
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-slate-600">الاسم</p>
                  <p className="text-sm font-semibold text-slate-900">{sale.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">رقم الهاتف</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {sale.customerPhone}
                  </p>
                </div>
              </div>
            </div>

            {/* Invoice Type & Status */}
            <div className="bg-slate-50 p-3 rounded">
              <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
                <svg
                  className="w-4 h-4 ml-1 text-blue-600"
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
                معلومات الفاتورة
              </h2>
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-slate-600">نوع الفاتورة</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      sale.invoiceType === "cash"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {INVOICE_TYPE_LABELS[sale.invoiceType]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-600">الوقت</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {format(
                      sale.createdAt instanceof Date ? sale.createdAt : new Date(sale.createdAt),
                      "hh:mm a",
                      { locale: ar }
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-3">المنتجات</h2>
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-right px-3 py-2 text-sm font-semibold text-slate-700">
                      #
                    </th>
                    <th className="text-right px-3 py-2 text-sm font-semibold text-slate-700">
                      اسم المنتج
                    </th>
                    <th className="text-center px-3 py-2 text-sm font-semibold text-slate-700">
                      سعر الوحدة
                    </th>
                    <th className="text-center px-3 py-2 text-sm font-semibold text-slate-700">
                      الكمية
                    </th>
                    <th className="text-center px-3 py-2 text-sm font-semibold text-slate-700">
                      الإجمالي
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sale.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-right text-sm text-slate-900">{index + 1}</td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-slate-900">
                        {item.productName}
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-slate-900">
                        {item.unitPrice.toFixed(2)} ج.م
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-center text-sm font-semibold text-slate-900">
                        {item.totalPrice.toFixed(2)} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="px-5 pb-5">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded border border-slate-200">
              <div className="space-y-2.5">
                {/* Total Amount */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-300">
                  <span className="text-base font-semibold text-slate-700">
                    إجمالي الفاتورة:
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {sale.totalAmount.toFixed(2)} ج.م
                  </span>
                </div>

                {/* Paid Amount */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">المبلغ المدفوع:</span>
                  <span className="text-base font-semibold text-green-600">
                    {sale.paidAmount.toFixed(2)} ج.م
                  </span>
                </div>

                {/* Deferred Amount */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">
                    الأجل (المتبقي من هذه الفاتورة):
                  </span>
                  <span className="text-base font-semibold text-orange-600">
                    {sale.deferredAmount.toFixed(2)} ج.م
                  </span>
                </div>

                {/* Previous Balance */}
                {sale.previousBalance > 0 && (
                  <>
                    <div className="border-t border-slate-300 pt-2"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-700">الرصيد السابق:</span>
                      <span className="text-base font-semibold text-red-600">
                        {sale.previousBalance.toFixed(2)} ج.م
                      </span>
                    </div>
                  </>
                )}

                {/* Current Balance */}
                {sale.currentBalance > 0 && (
                  <>
                    <div className="border-t border-slate-400 pt-2"></div>
                    <div className="flex justify-between items-center bg-white p-2.5 rounded">
                      <span className="text-base font-bold text-slate-900">
                        الرصيد الإجمالي على العميل:
                      </span>
                      <span className="text-xl font-bold text-red-600">
                        {sale.currentBalance.toFixed(2)} ج.م
                      </span>
                    </div>
                  </>
                )}

                {/* Fully Paid */}
                {sale.currentBalance === 0 && (
                  <div className="border-t border-green-400 pt-2">
                    <div className="flex justify-center items-center bg-green-50 p-2.5 rounded">
                      <svg
                        className="w-5 h-5 text-green-600 ml-1"
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
                      <span className="text-base font-bold text-green-700">
                        الفاتورة مدفوعة بالكامل
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Footer */}
          <div className="px-5 pb-5">
            <InvoiceFooter />
          </div>
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
            overflow: visible !important;
          }

          body > * {
            display: none !important;
          }

          body > #__next {
            display: block !important;
          }

          #invoice-print-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
          }

          #invoice-print-area,
          #invoice-print-area * {
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
