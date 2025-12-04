"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useSalesStore } from "@/features/sales/store/sales-store";
import { usePurchasesStore } from "@/features/purchases/store/purchases-store";
import { InvoiceType, InvoiceItem } from "@/features/sales/types";

interface GroupedProduct {
  productName: string;
  totalAvailableQuantity: number;
  unitPrice: number;
  purchases: Array<{ id: string; quantity: number; unitSellingPrice: number }>;
}

export default function EditSalePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const { sales, updateSale, customers, isLoading, fetchSales } = useSalesStore();
  const { purchases } = usePurchasesStore();

  const saleId = params.id as string;
  const sale = sales.find((s) => s.id === saleId);

  // Form State
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    customerName: "",
    customerPhone: "",
    invoiceType: "cash" as InvoiceType,
  });

  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [previousBalance, setPreviousBalance] = useState<number>(0);
  const [originalCustomerId, setOriginalCustomerId] = useState<string | undefined>();

  // Product selection state
  const [productSearch, setProductSearch] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  // Customer selection state
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();

  const [error, setError] = useState<string | null>(null);

  // Load sale data when component mounts
  useEffect(() => {
    if (user && sales.length === 0) {
      fetchSales(user.uid);
    }
  }, [user, sales.length, fetchSales]);

  useEffect(() => {
    if (sale) {
      setFormData({
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone,
        invoiceType: sale.invoiceType,
      });
      setSelectedItems(sale.items);
      setPaidAmount(sale.paidAmount);
      setPreviousBalance(sale.previousBalance);
      setCustomerSearch(sale.customerName);
      setSelectedCustomerId(sale.customerId);
      setOriginalCustomerId(sale.customerId);
    }
  }, [sale]);

  // Group products by name and calculate available quantities
  const groupedProducts = useMemo<GroupedProduct[]>(() => {
    const groups = new Map<string, GroupedProduct>();

    purchases.forEach((purchase) => {
      const existing = groups.get(purchase.productName);
      if (existing) {
        existing.totalAvailableQuantity += purchase.quantity;
        existing.purchases.push({
          id: purchase.id,
          quantity: purchase.quantity,
          unitSellingPrice: purchase.unitSellingPrice,
        });
      } else {
        groups.set(purchase.productName, {
          productName: purchase.productName,
          totalAvailableQuantity: purchase.quantity,
          unitPrice: purchase.unitSellingPrice,
          purchases: [
            {
              id: purchase.id,
              quantity: purchase.quantity,
              unitSellingPrice: purchase.unitSellingPrice,
            },
          ],
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) =>
      a.productName.localeCompare(b.productName, "ar")
    );
  }, [purchases]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    return groupedProducts.filter((product) =>
      product.productName.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [groupedProducts, productSearch]);

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  // Calculate totals
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.totalPrice,
    0
  );
  // Total balance before payment = previous balance + current invoice total
  const totalBalanceBeforePayment = previousBalance + totalAmount;
  // Current balance after payment = total balance - paid amount (cannot be negative)
  const currentBalance = Math.max(0, totalBalanceBeforePayment - paidAmount);
  // Deferred amount from THIS invoice only
  // If paid >= totalAmount, then deferred = 0
  // Otherwise, deferred = totalAmount - min(paidAmount, totalAmount)
  const paidForThisInvoice = Math.min(paidAmount, totalAmount);
  const deferredAmount = totalAmount - paidForThisInvoice;

  // Handle customer selection
  const handleSelectCustomer = (customer: typeof customers[0]) => {
    setFormData({
      ...formData,
      customerName: customer.name,
      customerPhone: customer.phone,
    });
    setCustomerSearch(customer.name);
    setSelectedCustomerId(customer.id);
    setPreviousBalance(customer.totalBalance);
    setShowCustomerSuggestions(false);
  };

  // Handle product selection
  const handleSelectProduct = (product: GroupedProduct) => {
    const existingItem = selectedItems.find(
      (item) => item.productName === product.productName
    );

    if (existingItem) {
      setError("المنتج موجود بالفعل في القائمة");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newItem: InvoiceItem = {
      productId: product.purchases[0].id,
      productName: product.productName,
      quantity: 1,
      unitPrice: product.unitPrice,
      totalPrice: product.unitPrice,
      availableQuantity: product.totalAvailableQuantity,
    };

    setSelectedItems([...selectedItems, newItem]);
    setProductSearch("");
    setShowProductSuggestions(false);
  };

  // Handle item quantity change
  const handleItemQuantityChange = (productName: string, quantity: number) => {
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.productName === productName) {
          const newQuantity = Math.max(1, Math.min(quantity, item.availableQuantity));
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  // Handle remove item
  const handleRemoveItem = (productName: string) => {
    setSelectedItems(selectedItems.filter((item) => item.productName !== productName));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user || !sale) {
      setError("يجب تسجيل الدخول أولاً");
      return;
    }

    // Validation
    if (!formData.invoiceNumber.trim()) {
      setError("يرجى إدخال رقم الفاتورة");
      return;
    }

    if (!formData.customerName.trim()) {
      setError("يرجى إدخال اسم العميل");
      return;
    }

    if (!formData.customerPhone.trim()) {
      setError("يرجى إدخال رقم هاتف العميل");
      return;
    }

    if (selectedItems.length === 0) {
      setError("يرجى إضافة منتج واحد على الأقل");
      return;
    }

    const maxAllowed = totalAmount + previousBalance;
    if (paidAmount < 0 || paidAmount > maxAllowed) {
      setError("المبلغ المدفوع غير صحيح");
      return;
    }

    try {
      await updateSale(saleId, {
        ...formData,
        customerId: selectedCustomerId,
        items: selectedItems,
        totalAmount,
        paidAmount,
        deferredAmount,
        previousBalance,
        currentBalance,
      });

      router.push("/sales");
    } catch (err: any) {
      setError(err.message || "فشل في تحديث الفاتورة");
    }
  };

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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/sales")}
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
          رجوع إلى المبيعات
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">تعديل الفاتورة</CardTitle>
          <CardDescription>تعديل بيانات فاتورة البيع رقم {sale.invoiceNumber}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">
                رقم الفاتورة <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invoiceNumber"
                placeholder="مثال: INV-001"
                value={formData.invoiceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceNumber: e.target.value })
                }
                disabled={isLoading}
                required
              />
            </div>

            {/* Customer Name */}
            <div className="space-y-2 relative">
              <Label htmlFor="customerName">
                اسم العميل <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerName"
                placeholder="ابحث عن عميل أو اكتب اسم جديد"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setFormData({ ...formData, customerName: e.target.value });
                  setShowCustomerSuggestions(true);
                  if (selectedCustomerId && selectedCustomerId !== originalCustomerId) {
                    setSelectedCustomerId(undefined);
                    setPreviousBalance(0);
                  }
                }}
                onFocus={() => setShowCustomerSuggestions(true)}
                disabled={isLoading}
                required
              />
              {showCustomerSuggestions && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      className="w-full px-4 py-2 text-right hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-slate-500">
                        {customer.phone} - رصيد سابق: {customer.totalBalance.toFixed(2)} ج.م
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Phone */}
            <div className="space-y-2">
              <Label htmlFor="customerPhone">
                رقم هاتف العميل <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="مثال: 01012345678"
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData({ ...formData, customerPhone: e.target.value })
                }
                disabled={isLoading}
                required
              />
            </div>

            {/* Invoice Type */}
            <div className="space-y-2">
              <Label htmlFor="invoiceType">
                نوع الفاتورة <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.invoiceType}
                onValueChange={(value: InvoiceType) =>
                  setFormData({ ...formData, invoiceType: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="credit">آجل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products Selection */}
            <div className="space-y-2">
              <Label htmlFor="productSearch">
                المنتجات <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="productSearch"
                  placeholder="ابحث عن منتج لإضافته..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductSuggestions(true);
                  }}
                  onFocus={() => setShowProductSuggestions(true)}
                  disabled={isLoading}
                />
                {showProductSuggestions && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.productName}
                        type="button"
                        className="w-full px-4 py-2 text-right hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                        onClick={() => handleSelectProduct(product)}
                      >
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-sm text-slate-500">
                          السعر: {product.unitPrice.toFixed(2)} ج.م - متاح: {product.totalAvailableQuantity}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Products Table */}
            {selectedItems.length > 0 && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                  <h3 className="font-semibold">المنتجات المحددة</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full" dir="rtl">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-right px-4 py-2 text-sm font-semibold text-slate-700">
                          اسم المنتج
                        </th>
                        <th className="text-center px-4 py-2 text-sm font-semibold text-slate-700">
                          سعر الوحدة
                        </th>
                        <th className="text-center px-4 py-2 text-sm font-semibold text-slate-700">
                          الكمية
                        </th>
                        <th className="text-center px-4 py-2 text-sm font-semibold text-slate-700">
                          الإجمالي
                        </th>
                        <th className="text-center px-4 py-2 text-sm font-semibold text-slate-700">
                          إجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedItems.map((item) => (
                        <tr key={item.productName}>
                          <td className="px-4 py-2 text-right">{item.productName}</td>
                          <td className="px-4 py-2 text-center">
                            {item.unitPrice.toFixed(2)} ج.م
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Input
                              type="number"
                              min="1"
                              max={item.availableQuantity}
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemQuantityChange(
                                  item.productName,
                                  Number(e.target.value)
                                )
                              }
                              className="w-20 text-center mx-auto"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              متاح: {item.availableQuantity}
                            </p>
                          </td>
                          <td className="px-4 py-2 text-center font-semibold">
                            {item.totalPrice.toFixed(2)} ج.م
                          </td>
                          <td className="px-4 py-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.productName)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <svg
                                className="w-4 h-4"
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
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            {selectedItems.length > 0 && (
              <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900">الملخص المالي</h3>

                {/* Total Amount */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">الإجمالي:</span>
                  <span className="text-lg font-bold text-slate-900">
                    {totalAmount.toFixed(2)} ج.م
                  </span>
                </div>

                {/* Paid Amount */}
                <div className="space-y-2">
                  <Label htmlFor="paidAmount">المدفوع</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    min="0"
                    max={totalAmount + previousBalance}
                    step="0.01"
                    value={paidAmount || ""}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      const maxAllowed = totalAmount + previousBalance;
                      const clampedValue = Math.max(0, Math.min(value, maxAllowed));
                      setPaidAmount(clampedValue);
                    }}
                    placeholder="أدخل المبلغ المدفوع"
                  />
                  <p className="text-xs text-slate-500">
                    الحد الأقصى: {(totalAmount + previousBalance).toFixed(2)} ج.م (الرصيد الحالي قبل الدفع)
                  </p>
                </div>

                {/* Deferred Amount */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">الأجل (المتبقي من هذه الفاتورة):</span>
                  <span className="text-lg font-semibold text-orange-600">
                    {deferredAmount.toFixed(2)} ج.م
                  </span>
                </div>

                {/* Previous Balance */}
                {previousBalance > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-600">الرصيد السابق:</span>
                    <span className="text-lg font-semibold text-red-600">
                      {previousBalance.toFixed(2)} ج.م
                    </span>
                  </div>
                )}

                {/* Current Balance */}
                <div className="flex justify-between items-center pt-2 border-t-2 border-slate-300">
                  <span className="text-slate-900 font-semibold">
                    الرصيد الحالي (الإجمالي على العميل):
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      currentBalance > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {currentBalance.toFixed(2)} ج.م
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/sales")}
                disabled={isLoading}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
