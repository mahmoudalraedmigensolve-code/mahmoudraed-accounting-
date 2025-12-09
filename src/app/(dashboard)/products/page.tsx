"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { usePurchasesStore } from "@/features/purchases/store/purchases-store";
import { useProductsStore } from "@/features/products/store/products-store";
import { useReactToPrint } from "react-to-print";
import { InvoiceFooter } from "@/components/common/InvoiceFooter";
import { MoreVertical, Trash2 } from "lucide-react";

interface DisplayProduct {
  id: string;
  productName: string;
  unitSellingPrice: number;
  source: "purchase" | "manual";
}

export default function ProductsPage() {
  const printRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { purchases, fetchPurchases } = usePurchasesStore();
  const { products: manualProducts, fetchProducts, createProduct, deleteProduct, hideProduct, hiddenProducts, fetchHiddenProducts, isLoading } = useProductsStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    productName: "",
    unitSellingPrice: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<DisplayProduct | null>(null);

  useEffect(() => {
    if (user) {
      fetchPurchases(user.uid);
      fetchProducts(user.uid);
      fetchHiddenProducts(user.uid);
    }
  }, [user, fetchPurchases, fetchProducts, fetchHiddenProducts]);

  // Combine products from purchases and manual products (excluding hidden ones)
  const allProducts = useMemo<DisplayProduct[]>(() => {
    const productMap = new Map<string, DisplayProduct>();

    // Add products from purchases (skip hidden ones)
    purchases.forEach((purchase) => {
      // Skip if product is hidden
      if (hiddenProducts.includes(purchase.productName)) return;

      if (!productMap.has(purchase.productName)) {
        productMap.set(purchase.productName, {
          id: purchase.id,
          productName: purchase.productName,
          unitSellingPrice: purchase.unitSellingPrice,
          source: "purchase",
        });
      } else {
        // Update price to latest
        const existing = productMap.get(purchase.productName)!;
        existing.unitSellingPrice = purchase.unitSellingPrice;
      }
    });

    // Add manual products (only if not already from purchases)
    manualProducts.forEach((product) => {
      if (!productMap.has(product.productName)) {
        productMap.set(product.productName, {
          id: product.id,
          productName: product.productName,
          unitSellingPrice: product.unitSellingPrice,
          source: "manual",
        });
      }
    });

    return Array.from(productMap.values()).sort((a, b) =>
      a.productName.localeCompare(b.productName, "ar")
    );
  }, [purchases, manualProducts, hiddenProducts]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "قائمة الأصناف والأسعار",
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setIsPrinting(false);
    },
  });

  const handleAddProduct = async () => {
    setError(null);

    if (!newProduct.productName.trim()) {
      setError("يرجى إدخال اسم الصنف");
      return;
    }

    if (newProduct.unitSellingPrice <= 0) {
      setError("يرجى إدخال سعر بيع صحيح");
      return;
    }

    // Check if product already exists
    const exists = allProducts.some(
      (p) => p.productName.toLowerCase() === newProduct.productName.toLowerCase()
    );
    if (exists) {
      setError("هذا الصنف موجود بالفعل");
      return;
    }

    if (!user) {
      setError("يجب تسجيل الدخول أولاً");
      return;
    }

    try {
      await createProduct(newProduct, user.uid);
      setNewProduct({ productName: "", unitSellingPrice: 0 });
      setIsDialogOpen(false);
    } catch (err: any) {
      setError(err.message || "فشل في إضافة الصنف");
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete || !user) return;

    try {
      if (productToDelete.source === "manual") {
        // Delete from manual products collection
        await deleteProduct(productToDelete.id);
      } else {
        // Hide product from list (doesn't delete purchases)
        await hideProduct(productToDelete.productName, user.uid);
      }
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err: any) {
      setError(err.message || "فشل في حذف الصنف");
    }
  };

  return (
    <div className="p-4 md:p-6 print:p-0 print:m-0">
      {/* Header - Hidden on Print */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            قائمة الأصناف والأسعار
          </h1>
          <p className="text-slate-600 mt-1">
            عرض جميع الأصناف وأسعار البيع
          </p>
        </div>

        <div className="flex gap-3">
          {/* Add Product Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                إضافة صنف
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة صنف جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="productName">اسم الصنف</Label>
                  <Input
                    id="productName"
                    placeholder="أدخل اسم الصنف"
                    value={newProduct.productName}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, productName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitSellingPrice">سعر بيع الوحدة (ج.م)</Label>
                  <Input
                    id="unitSellingPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="أدخل سعر البيع"
                    value={newProduct.unitSellingPrice || ""}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        unitSellingPrice: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleAddProduct}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "جاري الإضافة..." : "إضافة"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isLoading}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Print Button */}
          <Button
            onClick={handlePrint}
            disabled={isPrinting}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
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
            {isPrinting ? "جاري الطباعة..." : "طباعة القائمة"}
          </Button>
        </div>
      </div>

      {/* Products List - Printable */}
      <div
        id="products-print-area"
        ref={printRef}
        className="bg-white rounded-lg shadow-sm border border-slate-200 print:shadow-none print:border-none print:rounded-none"
        dir="rtl"
      >
        {/* Print Header */}
        <div className="hidden print:block p-6 border-b-2 border-slate-300 text-center bg-slate-50">
          <h1 className="text-2xl font-bold text-slate-900">قائمة الأصناف والأسعار</h1>
          <p className="text-slate-600 mt-1">
            تاريخ الطباعة: {new Date().toLocaleDateString("ar-EG")}
          </p>
        </div>

        {/* Stats - Hidden on Print */}
        <div className="p-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-slate-600">
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span className="font-semibold">{allProducts.length}</span>
            <span>صنف</span>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 w-16 border-b-2 border-slate-300">
                  #
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700 border-b-2 border-slate-300">
                  اسم الصنف
                </th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 w-40 border-b-2 border-slate-300">
                  سعر البيع
                </th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700 w-16 border-b-2 border-slate-300 print:hidden">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    لا توجد أصناف
                  </td>
                </tr>
              ) : (
                allProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50 print:hover:bg-transparent"
                  >
                    <td className="px-4 py-3 text-right text-sm text-slate-600 border-b border-slate-200">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-right border-b border-slate-200">
                      <span className="text-sm font-medium text-slate-900">
                        {product.productName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border-b border-slate-200">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        {product.unitSellingPrice.toFixed(2)} ج.م
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center border-b border-slate-200 print:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                            onClick={() => {
                              setProductToDelete(product);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف الصنف
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

        {/* Footer with WhatsApp QR Code */}
        <div className="p-4">
          <InvoiceFooter />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الصنف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الصنف &quot;{productToDelete?.productName}&quot;؟
              {productToDelete?.source === "purchase" && (
                <>
                  <br />
                  <span className="text-slate-600">
                    سيتم إخفاء الصنف من القائمة فقط، المشتريات لن تتأثر.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isLoading ? "جاري الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Reset everything */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Hide everything except print area */
          body * {
            visibility: hidden;
          }

          #products-print-area,
          #products-print-area * {
            visibility: visible;
          }

          #products-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }

          /* Force show print-only elements */
          .print\\:block {
            display: block !important;
          }

          /* Force hide screen-only elements */
          .print\\:hidden {
            display: none !important;
          }

          /* Table styling for print */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          th, td {
            border: 1px solid #e2e8f0 !important;
            padding: 8px 12px !important;
          }

          th {
            background-color: #f1f5f9 !important;
          }

          /* Badge styling for print */
          .bg-green-100 {
            background-color: #dcfce7 !important;
            border: 1px solid #16a34a !important;
          }

          /* Hide browser default header/footer (URL, date, page title) */
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}
