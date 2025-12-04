"use client";

import Image from "next/image";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface InvoiceHeaderProps {
  title: string;
  subtitle?: string;
  date?: Date;
}

export function InvoiceHeader({ title, subtitle, date }: InvoiceHeaderProps) {
  const { currentTenant } = useTenantsStore();

  const displayDate = date || new Date();

  return (
    <div
      className="text-white p-4 print:[print-color-adjust:exact] print:[-webkit-print-color-adjust:exact]"
      style={{ background: 'linear-gradient(to right, #2563eb, #1d4ed8)' }}
    >
      <div className="flex justify-between items-center">
        {/* Right Side - Invoice Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-base text-blue-100 mt-1">{subtitle}</p>
          )}
          {/* Date */}
          <div className="mt-2 text-sm text-blue-100">
            <span>التاريخ: {format(displayDate, "dd/MM/yyyy", { locale: ar })}</span>
          </div>
        </div>

        {/* Left Side - Logo and Company Name */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end text-left">
            {currentTenant?.name && (
              <h2 className="text-lg font-semibold">{currentTenant.name}</h2>
            )}
            {currentTenant?.phone && (
              <p className="text-sm text-blue-100">{currentTenant.phone}</p>
            )}
          </div>
          {currentTenant?.logo && (
            <div className="relative w-20 h-20 shrink-0">
              <Image
                src={currentTenant.logo}
                alt={currentTenant.name || "شعار الشركة"}
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
