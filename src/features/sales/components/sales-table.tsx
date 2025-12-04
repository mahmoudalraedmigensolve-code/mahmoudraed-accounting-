"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sale, INVOICE_TYPE_LABELS } from "../types";
import { useSalesStore } from "../store/sales-store";

interface SalesTableProps {
  sales: Sale[];
}

export function SalesTable({ sales }: SalesTableProps) {
  const router = useRouter();
  const { deleteSale } = useSalesStore();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (saleId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) {
      return;
    }

    try {
      setIsDeleting(saleId);
      await deleteSale(saleId);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  if (sales.length === 0) {
    return (
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
        <p className="text-slate-500 text-lg">لا توجد فواتير بعد</p>
        <p className="text-slate-400 text-sm mt-2">ابدأ بإضافة أول فاتورة</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200" dir="rtl">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b-2 border-slate-200">
            <tr>
              <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                #
              </th>
              <th className="text-right px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                رقم الفاتورة
              </th>
              <th className="text-right px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                اسم العميل
              </th>
              <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">
                نوع الفاتورة
              </th>
              <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                الإجمالي
              </th>
              <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                المدفوع
              </th>
              <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                المتبقي
              </th>
              <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                التاريخ
              </th>
              <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sales.map((sale, index) => (
              <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-medium text-slate-900">
                  {index + 1}
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm text-slate-900">
                  {sale.invoiceNumber}
                </td>
                <td
                  className="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm text-slate-900 max-w-[150px] truncate"
                  title={sale.customerName}
                >
                  {sale.customerName}
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden sm:table-cell">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      sale.invoiceType === "cash"
                        ? "bg-green-100 text-green-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {INVOICE_TYPE_LABELS[sale.invoiceType]}
                  </span>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900">
                  {sale.totalAmount.toFixed(2)} ج.م
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden lg:table-cell">
                  {sale.paidAmount.toFixed(2)} ج.م
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm hidden lg:table-cell">
                  <span
                    className={`font-semibold ${
                      sale.currentBalance > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {sale.currentBalance.toFixed(2)} ج.م
                  </span>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden md:table-cell">
                  {format(sale.createdAt, "dd/MM/yyyy - hh:mm a", {
                    locale: ar,
                  })}
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting === sale.id}
                      >
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/sales/${sale.id}`)}
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        عرض التفاصيل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/sales/edit/${sale.id}`)}
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(sale.id)}
                        className="text-red-600"
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
                        حذف
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
  );
}
