"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { usePurchasesStore } from "@/features/purchases/store/purchases-store";
import { useSalesStore } from "@/features/sales/store/sales-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface GroupedProduct {
  productName: string;
  purchasedQuantity: number;
  soldQuantity: number;
  availableQuantity: number;
  purchaseCount: number;
  currentUnitSellingPrice: number;
}

export default function InventoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { purchases, isLoading, fetchPurchases, updateSellingPriceByProductName } =
    usePurchasesStore();
  const { sales, fetchSales } = useSalesStore();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null);
  const [newSellingPrice, setNewSellingPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPurchases(user.uid);
      fetchSales(user.uid);
    }
  }, [user, fetchPurchases, fetchSales]);

  // Group purchases by product name and subtract sold quantities
  const groupedProducts = useMemo(() => {
    const groups = new Map<string, GroupedProduct>();

    // Add purchased quantities
    purchases.forEach((purchase) => {
      const existing = groups.get(purchase.productName);
      if (existing) {
        existing.purchasedQuantity += purchase.quantity;
        existing.purchaseCount += 1;
      } else {
        groups.set(purchase.productName, {
          productName: purchase.productName,
          purchasedQuantity: purchase.quantity,
          soldQuantity: 0,
          availableQuantity: purchase.quantity,
          purchaseCount: 1,
          currentUnitSellingPrice: purchase.unitSellingPrice,
        });
      }
    });

    // Subtract sold quantities (exclude payment invoices)
    sales
      .filter((sale) => sale.invoiceType !== "payment")
      .forEach((sale) => {
        sale.items.forEach((item) => {
          const existing = groups.get(item.productName);
          if (existing) {
            existing.soldQuantity += item.quantity;
          }
        });
      });

    // Calculate available quantity
    groups.forEach((product) => {
      product.availableQuantity = product.purchasedQuantity - product.soldQuantity;
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.productName.localeCompare(b.productName, "ar")
    );
  }, [purchases, sales]);

  const handleEditPrice = (product: GroupedProduct) => {
    setSelectedProduct(product);
    setNewSellingPrice(product.currentUnitSellingPrice.toString());
    setEditDialogOpen(true);
  };

  const handleSaveNewPrice = async () => {
    if (!selectedProduct || !user) return;

    const price = parseFloat(newSellingPrice);
    if (isNaN(price) || price < 0) {
      toast.error("يرجى إدخال سعر صحيح");
      return;
    }

    try {
      setIsUpdating(true);
      await updateSellingPriceByProductName(
        user.uid,
        selectedProduct.productName,
        price
      );
      toast.success("تم تحديث سعر البيع بنجاح");
      setEditDialogOpen(false);
      setSelectedProduct(null);
      setNewSellingPrice("");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء تحديث السعر");
    } finally {
      setIsUpdating(false);
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

  return (
    <div className="p-4 md:p-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">إجمالي الكميات</h1>
          <p className="text-slate-600 mt-1">عرض تفصيلي لكميات كل منتج</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/purchases")}>
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
          رجوع إلى المشتريات
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">الكمية المتاحة</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {groupedProducts.reduce((sum, p) => sum + p.availableQuantity, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">إجمالي المشتريات</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {groupedProducts.reduce((sum, p) => sum + p.purchasedQuantity, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">إجمالي المبيعات</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {groupedProducts.reduce((sum, p) => sum + p.soldQuantity, 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">عدد المنتجات</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {groupedProducts.length}
          </p>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-slate-200" dir="rtl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">
                  #
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">
                  اسم المنتج
                </th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">
                  الكمية المتاحة
                </th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 hidden md:table-cell">
                  المشتريات
                </th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 hidden md:table-cell">
                  المبيعات
                </th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 hidden md:table-cell">
                  سعر البيع
                </th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {groupedProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    لا توجد منتجات
                  </td>
                </tr>
              ) : (
                groupedProducts.map((product, index) => (
                  <tr
                    key={product.productName}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-center text-sm text-slate-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {product.productName}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        product.availableQuantity > 0
                          ? "bg-green-100 text-green-800"
                          : product.availableQuantity === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}>
                        {product.availableQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600 hidden md:table-cell">
                      {product.purchasedQuantity}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600 hidden md:table-cell">
                      {product.soldQuantity}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-900 hidden md:table-cell">
                      <span className="font-semibold text-blue-600">
                        {product.currentUnitSellingPrice.toFixed(2)} ج.م
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditPrice(product)}
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
                            تعديل سعر البيع
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Price Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل سعر البيع</DialogTitle>
            <DialogDescription>
              تعديل سعر بيع المنتج: <strong>{selectedProduct?.productName}</strong>
              <br />
              <span className="text-sm text-slate-500">
                سيتم تحديث السعر لجميع عمليات الشراء ({selectedProduct?.purchaseCount}{" "}
                عملية)
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sellingPrice">سعر البيع للوحدة (ج.م)</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={newSellingPrice}
                onChange={(e) => setNewSellingPrice(e.target.value)}
                placeholder="أدخل سعر البيع الجديد"
                disabled={isUpdating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isUpdating}
            >
              إلغاء
            </Button>
            <Button onClick={handleSaveNewPrice} disabled={isUpdating}>
              {isUpdating ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
