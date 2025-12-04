"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Settings } from "../types";

interface ExchangeRatesFormProps {
  settings: Settings | null;
  userId: string;
  onAutoUpdate: () => Promise<void>;
  onManualUpdate: (rates: { EGP: number; USD: number; GBP: number }) => Promise<void>;
}

export function ExchangeRatesForm({
  settings,
  userId,
  onAutoUpdate,
  onManualUpdate,
}: ExchangeRatesFormProps) {
  const [usdRate, setUsdRate] = useState("50");
  const [gbpRate, setGbpRate] = useState("65");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (settings?.exchangeRates) {
      setUsdRate(settings.exchangeRates.USD.toString());
      setGbpRate(settings.exchangeRates.GBP.toString());
    }
  }, [settings]);

  const handleAutoUpdate = async () => {
    setIsUpdating(true);
    try {
      await onAutoUpdate();
      toast.success("تم تحديث أسعار الصرف بنجاح!");
    } catch (error) {
      toast.error("فشل تحديث أسعار الصرف. حاول مرة أخرى.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManualUpdate = async () => {
    const usd = parseFloat(usdRate);
    const gbp = parseFloat(gbpRate);

    if (isNaN(usd) || isNaN(gbp) || usd <= 0 || gbp <= 0) {
      toast.error("يرجى إدخال أسعار صحيحة");
      return;
    }

    setIsUpdating(true);
    try {
      await onManualUpdate({
        EGP: 1,
        USD: usd,
        GBP: gbp,
      });
      toast.success("تم تحديث أسعار الصرف يدوياً بنجاح!");
    } catch (error) {
      toast.error("فشل تحديث أسعار الصرف. حاول مرة أخرى.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-2xl font-bold mb-6">أسعار الصرف</h2>

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              آخر تحديث:{" "}
              {settings?.exchangeRates?.lastUpdated
                ? new Date(settings.exchangeRates.lastUpdated).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "لم يتم التحديث بعد"}
            </span>
          </div>

          <Button
            onClick={handleAutoUpdate}
            disabled={isUpdating}
            variant="outline"
            className="w-full md:w-auto"
          >
            {isUpdating ? "جاري التحديث..." : "تحديث تلقائي من الإنترنت"}
          </Button>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">تحديث يدوي</h3>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>الجنيه المصري (EGP)</Label>
              <Input value="1.00" disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usd">الدولار الأمريكي (USD)</Label>
              <Input
                id="usd"
                type="number"
                step="0.01"
                value={usdRate}
                onChange={(e) => setUsdRate(e.target.value)}
                placeholder="50.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gbp">الجنيه الإسترليني (GBP)</Label>
              <Input
                id="gbp"
                type="number"
                step="0.01"
                value={gbpRate}
                onChange={(e) => setGbpRate(e.target.value)}
                placeholder="65.00"
              />
            </div>
          </div>

          <Button
            onClick={handleManualUpdate}
            disabled={isUpdating}
            className="mt-4 w-full md:w-auto"
          >
            {isUpdating ? "جاري الحفظ..." : "حفظ الأسعار"}
          </Button>
        </div>
      </div>
    </div>
  );
}
