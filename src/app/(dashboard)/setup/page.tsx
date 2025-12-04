"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";
import { TenantSetup } from "@/features/tenants/components/tenant-setup";

export default function SetupPage() {
  const router = useRouter();
  const { currentTenant } = useTenantsStore();

  useEffect(() => {
    // If tenant already exists, redirect to home
    if (currentTenant) {
      router.push("/");
    }
  }, [currentTenant, router]);

  const handleSetupComplete = () => {
    router.push("/");
  };

  return <TenantSetup onComplete={handleSetupComplete} />;
}
