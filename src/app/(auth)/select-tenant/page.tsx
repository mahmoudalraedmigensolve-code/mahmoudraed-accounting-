"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";
import { useUserTenants } from "@/features/tenants/hooks/use-user-tenants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft, Users } from "lucide-react";

export default function SelectTenantPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { setCurrentTenant } = useTenantsStore();
  const { userTenants, isLoading, error } = useUserTenants();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    // If user has only one tenant, auto-select it
    if (!isLoading && userTenants.length === 1) {
      handleSelectTenant(userTenants[0].tenant.id);
    }
  }, [isLoading, userTenants]);

  const handleSelectTenant = async (tenantId: string) => {
    const selectedTenant = userTenants.find((t) => t.tenant.id === tenantId);
    if (selectedTenant) {
      setCurrentTenant(selectedTenant.tenant);
      router.push("/");
    }
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, { label: string; className: string }> = {
      owner: { label: "مالك", className: "bg-purple-100 text-purple-800" },
      admin: { label: "مدير", className: "bg-blue-100 text-blue-800" },
      user: { label: "مستخدم", className: "bg-gray-100 text-gray-800" },
    };
    const roleInfo = roleLabels[role] || roleLabels.user;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${roleInfo.className}`}>
        {roleInfo.label}
      </span>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">جاري تحميل الشركات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">حدث خطأ</h3>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userTenants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              لا توجد شركات متاحة
            </h3>
            <p className="text-slate-600 mb-4">
              لم يتم إضافتك لأي شركة بعد. يرجى التواصل مع مسؤول النظام لإضافتك.
            </p>
            <p className="text-sm text-slate-500">
              البريد الإلكتروني: {user?.email}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">اختر الشركة</h1>
          <p className="text-slate-600">
            لديك صلاحية الوصول للشركات التالية. اختر الشركة التي تريد الدخول إليها.
          </p>
        </div>

        <div className="space-y-4">
          {userTenants.map(({ tenant, role }) => (
            <Card
              key={tenant.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-500"
              onClick={() => handleSelectTenant(tenant.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {tenant.logo ? (
                    <img
                      src={tenant.logo}
                      alt={tenant.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {tenant.name}
                      </h3>
                      {getRoleBadge(role)}
                    </div>
                    {tenant.email && (
                      <p className="text-sm text-slate-500">{tenant.email}</p>
                    )}
                    {tenant.phone && (
                      <p className="text-sm text-slate-500">{tenant.phone}</p>
                    )}
                  </div>
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
