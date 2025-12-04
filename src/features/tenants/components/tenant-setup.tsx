"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTenantsStore } from "../store/tenants-store";
import { TenantFormData } from "../types";

interface TenantSetupProps {
  onComplete?: () => void;
}

export function TenantSetup({ onComplete }: TenantSetupProps) {
  const { createTenant, isLoading, error } = useTenantsStore();
  const [formData, setFormData] = useState<TenantFormData>({
    name: "",
    slug: "",
    phone: "",
    email: "",
    address: "",
    logo: "",
    whatsappQRCode: "",
    settings: {
      currency: "EGP",
      language: "ar",
      timezone: "Africa/Cairo",
      exchangeRates: {
        USD: 50,
        GBP: 63,
      },
    },
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.name.trim()) {
      setLocalError("يرجى إدخال اسم الشركة");
      return;
    }

    if (!formData.slug.trim()) {
      setLocalError("يرجى إدخال معرف الشركة (slug)");
      return;
    }

    try {
      await createTenant(formData);
      onComplete?.();
    } catch (err: any) {
      setLocalError(err.message || "فشل في إنشاء الشركة");
    }
  };

  const handleChange = (field: keyof TenantFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6" dir="rtl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">إعداد الشركة</h1>
          <p className="text-slate-600 mt-2">أدخل بيانات الشركة للبدء</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || localError) && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error || localError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">اسم الشركة *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="مثال: شركة موفكس"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">معرف الشركة (Slug) *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => handleChange("slug", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="مثال: moffex"
              dir="ltr"
              required
            />
            <p className="text-xs text-slate-500">
              سيستخدم للتعريف بالشركة في النظام (بالإنجليزية فقط)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="01xxxxxxxxx"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@company.com"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="عنوان الشركة"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">رابط الشعار (Logo URL)</Label>
            <Input
              id="logo"
              value={formData.logo}
              onChange={(e) => handleChange("logo", e.target.value)}
              placeholder="https://..."
              dir="ltr"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "جاري الإنشاء..." : "إنشاء الشركة"}
          </Button>
        </form>
      </div>
    </div>
  );
}
