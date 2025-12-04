"use client";

import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Purchase, CURRENCY_SYMBOLS } from "../types";

interface ViewPurchaseDialogProps {
  purchase: Purchase | null;
  open: boolean;
  onClose: () => void;
}

export function ViewPurchaseDialog({
  purchase,
  open,
  onClose,
}: ViewPurchaseDialogProps) {
  if (!purchase) return null;

  const profit = purchase.sellingPrice - purchase.purchasePrice;
  const profitMargin = ((profit / purchase.purchasePrice) * 100).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            تفاصيل السلعة
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Product Name */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">اسم المنتج</p>
            <p className="text-lg font-semibold text-slate-900">
              {purchase.productName}
            </p>
          </div>

          {/* Supplier Name */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">اسم المورد</p>
            <p className="text-lg font-semibold text-slate-900">
              {purchase.supplierName}
            </p>
          </div>

          {/* Supplier Phone */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">رقم هاتف المورد</p>
            <p className="text-lg font-semibold text-slate-900 direction-ltr">
              {purchase.supplierPhone}
            </p>
          </div>

          {/* Quantity */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">الكمية</p>
            <p className="text-lg font-semibold text-slate-900">
              {purchase.quantity}
            </p>
          </div>

          {/* Unit Purchase Price */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">سعر شراء الوحدة</p>
            <p className="text-lg font-semibold text-slate-900">
              {purchase.unitPurchasePrice.toFixed(2)} {CURRENCY_SYMBOLS[purchase.currency]}
            </p>
          </div>

          {/* Total Purchase Price */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">السعر الإجمالي للشراء</p>
            <p className="text-lg font-semibold text-slate-900">
              {purchase.purchasePrice.toFixed(2)} {CURRENCY_SYMBOLS[purchase.currency]}
            </p>
          </div>

          {/* Unit Selling Price */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">سعر بيع الوحدة</p>
            <p className="text-lg font-semibold text-slate-900">
              {purchase.unitSellingPrice.toFixed(2)} {CURRENCY_SYMBOLS[purchase.currency]}
            </p>
          </div>

          {/* Total Selling Price */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">السعر الإجمالي للبيع</p>
            <p className="text-lg font-semibold text-slate-900">
              {purchase.sellingPrice.toFixed(2)} {CURRENCY_SYMBOLS[purchase.currency]}
            </p>
          </div>

          {/* Currency */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">العملة</p>
            <p className="text-lg font-semibold text-slate-900">
              {purchase.currency === "EGP" && "جنيه مصري (EGP)"}
              {purchase.currency === "USD" && "دولار أمريكي (USD)"}
              {purchase.currency === "GBP" && "جنيه إسترليني (GBP)"}
            </p>
          </div>

          {/* Purchase Date */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">تاريخ الشراء</p>
            <p className="text-lg font-semibold text-slate-900">
              {format(purchase.createdAt, "dd/MM/yyyy - hh:mm a", {
                locale: ar,
              })}
            </p>
          </div>

          {/* Last Updated */}
          {purchase.updatedAt.getTime() !== purchase.createdAt.getTime() && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">آخر تحديث</p>
              <p className="text-lg font-semibold text-slate-900">
                {format(purchase.updatedAt, "dd/MM/yyyy - hh:mm a", {
                  locale: ar,
                })}
              </p>
            </div>
          )}

          {/* Profit - Full Width */}
          <div className={`md:col-span-2 p-4 rounded-lg ${profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-sm text-slate-600 mb-1">الربح المتوقع</p>
            <p className={`text-lg font-semibold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {profit.toFixed(2)} {CURRENCY_SYMBOLS[purchase.currency]}
              <span className="text-sm mr-2">({profitMargin}%)</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
