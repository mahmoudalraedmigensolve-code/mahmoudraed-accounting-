"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { toast } from "sonner";
import Image from "next/image";
import type { Tenant, TenantFormData } from "../types";

interface TenantSettingsFormProps {
  tenant: Tenant | null;
  onSave: (data: Partial<TenantFormData>) => Promise<void>;
}

export function TenantSettingsForm({ tenant, onSave }: TenantSettingsFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [qrPreview, setQrPreview] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || "");
      setPhone(tenant.phone || "");
      setEmail(tenant.email || "");
      setAddress(tenant.address || "");
      setLogoPreview(tenant.logo || "");
      setQrPreview(tenant.whatsappQRCode || "");
    }
  }, [tenant]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("يرجى إدخال اسم الشركة");
      return;
    }

    setIsUpdating(true);
    try {
      let logoUrl = tenant?.logo || "";
      let qrUrl = tenant?.whatsappQRCode || "";

      if (logoFile) {
        toast.info("جاري رفع الشعار...");
        logoUrl = await uploadToCloudinary(logoFile, "company-logos");
      }

      if (qrFile) {
        toast.info("جاري رفع رمز الاستجابة السريعة...");
        qrUrl = await uploadToCloudinary(qrFile, "whatsapp-qr");
      }

      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        logo: logoUrl,
        whatsappQRCode: qrUrl,
      });

      toast.success("تم حفظ معلومات الشركة بنجاح!");
      setLogoFile(null);
      setQrFile(null);
    } catch (error: any) {
      toast.error(error.message || "فشل حفظ معلومات الشركة. حاول مرة أخرى.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!tenant) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <div className="text-center text-muted-foreground">
          لا توجد بيانات شركة. يرجى إعداد الشركة أولاً.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-2xl font-bold mb-6">معلومات الشركة</h2>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">اسم الشركة *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسم الشركة"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="أدخل رقم الهاتف"
              dir="ltr"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="أدخل البريد الإلكتروني"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="أدخل عنوان الشركة"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="logo">شعار الشركة</Label>
            <div className="flex flex-col gap-4">
              {logoPreview && (
                <div className="relative h-32 w-32 rounded-lg border overflow-hidden">
                  <Image
                    src={logoPreview}
                    alt="Company Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                ref={logoInputRef}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr">رمز الاستجابة السريعة للواتساب</Label>
            <div className="flex flex-col gap-4">
              {qrPreview && (
                <div className="relative h-32 w-32 rounded-lg border overflow-hidden">
                  <Image
                    src={qrPreview}
                    alt="WhatsApp QR Code"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <Input
                id="qr"
                type="file"
                accept="image/*"
                onChange={handleQrChange}
                ref={qrInputRef}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground mb-4">
            <strong>معرف الشركة (Slug):</strong> {tenant.slug}
          </div>
        </div>

        <Button onClick={handleSave} disabled={isUpdating} className="w-full md:w-auto">
          {isUpdating ? "جاري الحفظ..." : "حفظ معلومات الشركة"}
        </Button>
      </div>
    </div>
  );
}
