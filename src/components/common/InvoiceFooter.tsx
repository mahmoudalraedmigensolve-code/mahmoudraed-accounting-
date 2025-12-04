"use client";

import Image from "next/image";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";

export function InvoiceFooter() {
  const { currentTenant } = useTenantsStore();

  // Debug: Log tenant
  console.log('InvoiceFooter: currentTenant:', currentTenant);
  console.log('InvoiceFooter: whatsappQRCode:', currentTenant?.whatsappQRCode);

  // Don't show footer if no WhatsApp QR
  if (!currentTenant?.whatsappQRCode) {
    console.log('InvoiceFooter: No WhatsApp QR code found in tenant, not showing footer');
    return null;
  }

  return (
    <div
      className="border-t-2 border-slate-200 mt-6 pt-6"
      style={{
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* Center - WhatsApp QR Code */}
      <div className="flex flex-col items-center justify-center">
        <p className="text-sm text-slate-600 font-medium mb-3">تواصل معنا عبر واتساب</p>
        <div className="bg-white p-3 rounded-xl border-2 border-slate-300 shadow-sm">
          <div className="relative w-32 h-32">
            <Image
              src={currentTenant.whatsappQRCode}
              alt="رمز QR للواتساب"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* Bottom Text */}
      <div className="text-center mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          شكراً لتعاملكم معنا • نتطلع لخدمتكم دائماً
        </p>
      </div>
    </div>
  );
}
