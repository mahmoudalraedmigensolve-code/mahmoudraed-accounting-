"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { TenantProvider } from "@/features/tenants/components/tenant-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut, initializeAuthListener } =
    useAuthStore();
  const { currentTenant } = useTenantsStore();

  useEffect(() => {
    initializeAuthListener();
  }, [initializeAuthListener]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TenantProvider requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              {currentTenant?.logo && (
                <img
                  src={currentTenant.logo}
                  alt={currentTenant.name}
                  className="h-10 w-10 object-contain"
                />
              )}
              <h1 className="text-2xl font-bold text-slate-900">
                {currentTenant?.name || "نظام المحاسبة"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                مرحباً، {user?.displayName || user?.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content with Sidebar */}
        <div className="flex">
          <Sidebar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </TenantProvider>
  );
}
