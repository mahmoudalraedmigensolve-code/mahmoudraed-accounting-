"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  purchasedQuantity: number;
  soldQuantity: number;
  totalAvailableQuantity: number;
  unitPrice: number;
  unitPurchasePrice: number;
  purchases: Array<{ id: string; quantity: number; unitSellingPrice: number; unitPurchasePrice: number }>;
}

export default function AddSalePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createSale, customers, sales, isLoading } = useSalesStore();
  const { purchases } = usePurchasesStore();

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

  // Product selection state
  const [productSearch, setProductSearch] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  // Customer selection state
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();

  const [error, setError] = useState<string | null>(null);

  // Group products by name AND price to handle same product with different prices
  const groupedProducts = useMemo<GroupedProduct[]>(() => {
    const groups = new Map<string, GroupedProduct>();

    // Add purchased quantities - use productName + unitSellingPrice as key
    purchases.forEach((purchase) => {
      const groupKey = `${purchase.productName}|${purchase.unitSellingPrice}`;
      const existing = groups.get(groupKey);
      if (existing) {
        existing.purchasedQuantity += purchase.quantity;
        existing.purchases.push({
          id: purchase.id,
          quantity: purchase.quantity,
          unitSellingPrice: purchase.unitSellingPrice,
          unitPurchasePrice: purchase.unitPurchasePrice,
        });
      } else {
        groups.set(groupKey, {
          productName: purchase.productName,
          purchasedQuantity: purchase.quantity,
          soldQuantity: 0,
          totalAvailableQuantity: purchase.quantity,
          unitPrice: purchase.unitSellingPrice,
          unitPurchasePrice: purchase.unitPurchasePrice,
          purchases: [
            {
              id: purchase.id,
              quantity: purchase.quantity,
              unitSellingPrice: purchase.unitSellingPrice,
              unitPurchasePrice: purchase.unitPurchasePrice,
            },
          ],
        });
      }
    });

    // Subtract sold quantities (exclude payment invoices)
    sales
      .filter((sale) => sale.invoiceType !== "payment")
      .forEach((sale) => {
        sale.items.forEach((item) => {
          const groupKey = `${item.productName}|${item.unitPrice}`;
          const existing = groups.get(groupKey);
          if (existing) {
            existing.soldQuantity += item.quantity;
          }
        });
      });

    // Calculate available quantity
    groups.forEach((product) => {
      product.totalAvailableQuantity = product.purchasedQuantity - product.soldQuantity;
    });

    return Array.from(groups.values())
      .filter((product) => product.totalAvailableQuantity > 0) // Only show products with available stock
      .sort((a, b) => {
        // Sort by product name first, then by price
        const nameCompare = a.productName.localeCompare(b.productName, "ar");
        if (nameCompare !== 0) return nameCompare;
        return a.unitPrice - b.unitPrice;
      });
  }, [purchases, sales]);

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
    // Check if product with same name AND price already selected
    const existingItem = selectedItems.find(
      (item) => item.productName === product.productName && item.unitPrice === product.unitPrice
    );

    if (existingItem) {
      setError("المنتج بنفس السعر موجود بالفعل في القائمة");
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
  const handleItemQuantityChange = (productName: string, unitPrice: number, quantity: number) => {
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.productName === productName && item.unitPrice === unitPrice) {
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

  // Handle item unit price change
  const handleItemPriceChange = (productName: string, originalPrice: number, newPrice: number) => {
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.productName === productName && item.unitPrice === originalPrice) {
          const price = Math.max(0, newPrice);
          return {
            ...item,
            unitPrice: price,
            totalPrice: item.quantity * price,
          };
        }
        return item;
      })
    );
  };

  // Handle remove item
  const handleRemoveItem = (productName: string, unitPrice: number) => {
    setSelectedItems(selectedItems.filter((item) => !(item.productName === productName && item.unitPrice === unitPrice)));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
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

    if (paidAmount < 0 || paidAmount > totalAmount + previousBalance) {
      setError("المبلغ المدفوع غير صحيح");
      return;
    }

    try {
      await createSale(
        {
          ...formData,
          customerId: selectedCustomerId,
          items: selectedItems,
          totalAmount,
          paidAmount,
          deferredAmount,
          previousBalance,
          currentBalance,
        },
        user.uid
      );

      router.push("/sales");
    } catch (err: any) {
      setError(err.message || "فشل في إضافة الفاتورة");
    }
  };

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
          <CardTitle className="text-2xl">إضافة فاتورة جديدة</CardTitle>
          <CardDescription>أدخل بيانات فاتورة البيع</CardDescription>
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

            {/* Customer Name with Autocomplete */}
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
                  // Reset selected customer if search changes
                  if (selectedCustomerId) {
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
                        key={`${product.productName}-${product.unitPrice}`}
                        type="button"
                        className="w-full px-4 py-2 text-right hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
                        onClick={() => handleSelectProduct(product)}
                      >
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-sm text-slate-500">
                          سعر البيع: {product.unitPrice.toFixed(2)} ج.م - سعر الشراء: {product.unitPurchasePrice.toFixed(2)} ج.م - متاح: {product.totalAvailableQuantity}
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
                        <tr key={`${item.productName}-${item.unitPrice}`}>
                          <td className="px-4 py-2 text-right">{item.productName}</td>
                          <td className="px-4 py-2 text-center">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemPriceChange(
                                  item.productName,
                                  item.unitPrice,
                                  Number(e.target.value)
                                )
                              }
                              className="w-24 text-center mx-auto"
                            />
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
                                  item.unitPrice,
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
                              onClick={() => handleRemoveItem(item.productName, item.unitPrice)}
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
                      // Maximum is total amount + previous balance (current balance before payment)
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
                {isLoading ? "جاري الحفظ..." : "حفظ الفاتورة"}
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
