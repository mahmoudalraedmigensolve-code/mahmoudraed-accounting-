"use client";

import { useEffect, useState, ReactNode } from "react";
import { useTenantsStore } from "../store/tenants-store";
import { useAuthStore } from "@/features/auth/store/auth-store";
import {
  tenantUsersService,
  generateDeviceId,
  getDeviceName,
} from "../services/tenant-users-service";
import { TenantUser, TenantUserRole, DeviceInfo } from "../types";
import { Button } from "@/components/ui/button";
import { Smartphone, AlertTriangle } from "lucide-react";

// Get tenant ID from environment variable
const ENV_TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID;

interface TenantProviderProps {
  children: ReactNode;
  requireAuth?: boolean; // If true, will verify user has access to tenant
}

interface TenantUserContext {
  tenantUser: TenantUser | null;
  userRole: TenantUserRole | null;
  hasAccess: boolean;
}

export function TenantProvider({
  children,
  requireAuth = false,
}: TenantProviderProps) {
  const { currentTenant, fetchTenantById, isLoading } = useTenantsStore();
  const { user, isAuthenticated, signOut } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  const [userContext, setUserContext] = useState<TenantUserContext>({
    tenantUser: null,
    userRole: null,
    hasAccess: false,
  });
  const [accessDenied, setAccessDenied] = useState(false);
  const [deviceDenied, setDeviceDenied] = useState(false);
  const [deviceDeniedMessage, setDeviceDeniedMessage] = useState("");

  useEffect(() => {
    const initializeTenant = async () => {
      // Check if tenant ID is configured
      if (!ENV_TENANT_ID) {
        console.error("NEXT_PUBLIC_TENANT_ID is not configured");
        setInitialized(true);
        return;
      }

      // Always fetch fresh tenant data from Firebase to ensure cross-device sync
      const tenant = await fetchTenantById(ENV_TENANT_ID);

      // If auth is required and user is authenticated, verify access
      if (requireAuth && isAuthenticated && user && tenant) {
        // Generate device ID for this browser
        const deviceId = generateDeviceId();

        // Check device access
        const deviceCheck = await tenantUsersService.checkDeviceAccess(
          tenant.id,
          user.uid,
          deviceId
        );

        if (!deviceCheck.allowed) {
          if (deviceCheck.reason?.includes("الحد الأقصى")) {
            // Device limit reached
            setDeviceDenied(true);
            setDeviceDeniedMessage(deviceCheck.reason || "");
          } else {
            // User not found or inactive
            setAccessDenied(true);
          }
          setInitialized(true);
          return;
        }

        const tenantUser = deviceCheck.user;

        if (tenantUser && tenantUser.isActive) {
          // Register this device if not already registered
          const registeredDevices = tenantUser.registeredDevices || [];
          const isDeviceRegistered = registeredDevices.some(
            (d) => d.deviceId === deviceId
          );

          if (!isDeviceRegistered) {
            // Register new device
            const deviceInfo: DeviceInfo = {
              deviceId,
              deviceName: getDeviceName(),
              userAgent:
                typeof navigator !== "undefined" ? navigator.userAgent : "",
              registeredAt: new Date(),
              lastActiveAt: new Date(),
            };
            await tenantUsersService.registerDevice(
              tenant.id,
              tenantUser.id,
              deviceInfo
            );
          } else {
            // Update last active time
            await tenantUsersService.updateDeviceActivity(
              tenant.id,
              tenantUser.id,
              deviceId
            );
          }

          setUserContext({
            tenantUser,
            userRole: tenantUser.role,
            hasAccess: true,
          });
          setAccessDenied(false);
          setDeviceDenied(false);
        } else {
          setUserContext({
            tenantUser: null,
            userRole: null,
            hasAccess: false,
          });
          setAccessDenied(true);
        }
      } else if (!requireAuth) {
        // No auth required, grant access
        setUserContext({
          tenantUser: null,
          userRole: null,
          hasAccess: true,
        });
      }

      setInitialized(true);
    };

    initializeTenant();
  }, [fetchTenantById, requireAuth, isAuthenticated, user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show loading while initializing
  if (!initialized && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">جاري تحميل بيانات الشركة...</p>
        </div>
      </div>
    );
  }

  // Show device limit exceeded message
  if (requireAuth && deviceDenied) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50"
        dir="rtl"
      >
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            تم تجاوز الحد الأقصى للأجهزة
          </h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            {deviceDeniedMessage}
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700 text-right">
                إذا كنت بحاجة لاستخدام جهاز جديد، يرجى التواصل مع الدعم الفني لإعادة
                تعيين الأجهزة المسجلة.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              البريد الإلكتروني: {user?.email}
            </p>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full"
            >
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have access
  if (requireAuth && accessDenied) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50"
        dir="rtl"
      >
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            غير مصرح بالوصول
          </h2>
          <p className="text-slate-600 mb-4">
            ليس لديك صلاحية للوصول إلى هذه الشركة. يرجى التواصل مع مسؤول النظام
            لإضافتك كمستخدم.
          </p>
          <p className="text-sm text-slate-500 mb-4">
            البريد الإلكتروني: {user?.email}
          </p>
          <Button variant="outline" onClick={handleSignOut} className="w-full">
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
