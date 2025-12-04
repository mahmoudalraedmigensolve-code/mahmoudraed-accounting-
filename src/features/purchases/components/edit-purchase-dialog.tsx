"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Purchase, Currency, CURRENCY_LABELS } from "../types";
import { usePurchasesStore } from "../store/purchases-store";

interface EditPurchaseDialogProps {
  purchase: Purchase;
  open: boolean;
  onClose: () => void;
}

export function EditPurchaseDialog({
  purchase,
  open,
  onClose,
}: EditPurchaseDialogProps) {
  const { updatePurchase, isLoading } = usePurchasesStore();
  const [formData, setFormData] = useState({
    productName: purchase.productName,
    quantity: purchase.quantity,
    unitPurchasePrice: purchase.unitPurchasePrice,
    purchasePrice: purchase.purchasePrice,
    unitSellingPrice: purchase.unitSellingPrice,
    sellingPrice: purchase.sellingPrice,
    supplierName: purchase.supplierName,
    supplierPhone: purchase.supplierPhone,
    currency: purchase.currency,
  });

  useEffect(() => {
    setFormData({
      productName: purchase.productName,
      quantity: purchase.quantity,
      unitPurchasePrice: purchase.unitPurchasePrice,
      purchasePrice: purchase.purchasePrice,
      unitSellingPrice: purchase.unitSellingPrice,
      sellingPrice: purchase.sellingPrice,
      supplierName: purchase.supplierName,
      supplierPhone: purchase.supplierPhone,
      currency: purchase.currency,
    });
  }, [purchase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updatePurchase(purchase.id, formData);
      onClose();
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تعديل السلعة</DialogTitle>
          <DialogDescription>قم بتعديل بيانات السلعة</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-productName">اسم السلعة</Label>
            <Input
              id="edit-productName"
              value={formData.productName}
              onChange={(e) =>
                setFormData({ ...formData, productName: e.target.value })
              }
              disabled={isLoading}
              required
            />
          </div>

          {/* Supplier Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-supplierName">اسم المورد</Label>
            <Input
              id="edit-supplierName"
              value={formData.supplierName}
              onChange={(e) =>
                setFormData({ ...formData, supplierName: e.target.value })
              }
              disabled={isLoading}
              required
            />
          </div>

          {/* Supplier Phone */}
          <div className="space-y-2">
            <Label htmlFor="edit-supplierPhone">رقم هاتف المورد</Label>
            <Input
              id="edit-supplierPhone"
              type="tel"
              value={formData.supplierPhone}
              onChange={(e) =>
                setFormData({ ...formData, supplierPhone: e.target.value })
              }
              disabled={isLoading}
              required
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="edit-quantity">الكمية</Label>
            <Input
              id="edit-quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => {
                const quantity = Number(e.target.value);
                setFormData({
                  ...formData,
                  quantity,
                  purchasePrice: formData.unitPurchasePrice * quantity,
                  sellingPrice: formData.unitSellingPrice * quantity,
                });
              }}
              disabled={isLoading}
              required
            />
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="edit-currency">العملة</Label>
            <Select
              value={formData.currency}
              onValueChange={(value: Currency) =>
                setFormData({ ...formData, currency: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit Purchase Price */}
          <div className="space-y-2">
            <Label htmlFor="edit-unitPurchasePrice">سعر شراء الوحدة</Label>
            <Input
              id="edit-unitPurchasePrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.unitPurchasePrice}
              onChange={(e) => {
                const unitPrice = Number(e.target.value);
                setFormData({
                  ...formData,
                  unitPurchasePrice: unitPrice,
                  purchasePrice: unitPrice * formData.quantity,
                });
              }}
              disabled={isLoading}
              required
            />
          </div>

          {/* Total Purchase Price */}
          <div className="space-y-2">
            <Label htmlFor="edit-purchasePrice">السعر الإجمالي للشراء</Label>
            <Input
              id="edit-purchasePrice"
              type="number"
              step="0.01"
              value={formData.purchasePrice}
              disabled
              className="bg-slate-50"
            />
          </div>

          {/* Unit Selling Price */}
          <div className="space-y-2">
            <Label htmlFor="edit-unitSellingPrice">سعر بيع الوحدة</Label>
            <Input
              id="edit-unitSellingPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.unitSellingPrice}
              onChange={(e) => {
                const unitPrice = Number(e.target.value);
                setFormData({
                  ...formData,
                  unitSellingPrice: unitPrice,
                  sellingPrice: unitPrice * formData.quantity,
                });
              }}
              disabled={isLoading}
              required
            />
          </div>

          {/* Total Selling Price */}
          <div className="space-y-2">
            <Label htmlFor="edit-sellingPrice">السعر الإجمالي للبيع</Label>
            <Input
              id="edit-sellingPrice"
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              disabled
              className="bg-slate-50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
