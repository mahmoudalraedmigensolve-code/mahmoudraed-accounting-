"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Purchase, CURRENCY_SYMBOLS } from "../types";
import { usePurchasesStore } from "../store/purchases-store";
import { EditPurchaseDialog } from "./edit-purchase-dialog";
import { ViewPurchaseDialog } from "./view-purchase-dialog";

interface PurchasesTableProps {
  purchases: Purchase[];
}

export function PurchasesTable({ purchases }: PurchasesTableProps) {
  const { deletePurchase } = usePurchasesStore();
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (purchaseId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه السلعة؟")) {
      return;
    }

    try {
      setIsDeleting(purchaseId);
      await deletePurchase(purchaseId);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  if (purchases.length === 0) {
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
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-slate-500 text-lg">لا توجد مشتريات بعد</p>
        <p className="text-slate-400 text-sm mt-2">ابدأ بإضافة أول سلعة</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200" dir="rtl">
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
                <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell">
                  الكمية
                </th>
                <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  سعر الشراء
                </th>
                <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell">
                  سعر البيع
                </th>
                <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell">
                  تاريخ الشراء
                </th>
                <th className="text-center px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-700 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {purchases.map((purchase, index) => (
                <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-medium text-slate-900">
                    {index + 1}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm text-slate-900 max-w-[150px] truncate" title={purchase.productName}>
                    {purchase.productName}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden sm:table-cell">
                    {purchase.quantity}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900">
                    {purchase.purchasePrice.toFixed(2)} {CURRENCY_SYMBOLS[purchase.currency]}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden lg:table-cell">
                    {purchase.sellingPrice.toFixed(2)} {CURRENCY_SYMBOLS[purchase.currency]}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900 hidden md:table-cell">
                    {format(purchase.createdAt, "dd/MM/yyyy - hh:mm a", {
                      locale: ar,
                    })}
                  </td>
                  <td className="px-3 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm text-slate-900">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting === purchase.id}
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
                        onClick={() => setViewingPurchase(purchase)}
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
                        onClick={() => setEditingPurchase(purchase)}
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
                        onClick={() => handleDelete(purchase.id)}
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

      {editingPurchase && (
        <EditPurchaseDialog
          purchase={editingPurchase}
          open={!!editingPurchase}
          onClose={() => setEditingPurchase(null)}
        />
      )}

      {viewingPurchase && (
        <ViewPurchaseDialog
          purchase={viewingPurchase}
          open={!!viewingPurchase}
          onClose={() => setViewingPurchase(null)}
        />
      )}
    </>
  );
}
