"use client";

import { useState, useEffect } from "react";
import { useTenantsStore } from "../store/tenants-store";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { tenantUsersService } from "../services/tenant-users-service";
import { TenantUser, TenantUserRole } from "../types";

interface UseTenantUserReturn {
  tenantUser: TenantUser | null;
  userRole: TenantUserRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTenantUser(): UseTenantUserReturn {
  const { currentTenant } = useTenantsStore();
  const { user, isAuthenticated } = useAuthStore();
  const [tenantUser, setTenantUser] = useState<TenantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenantUser = async () => {
    if (!currentTenant || !user || !isAuthenticated) {
      setTenantUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userData = await tenantUsersService.getUserByFirebaseUid(
        currentTenant.id,
        user.uid
      );
      setTenantUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user data");
      setTenantUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantUser();
  }, [currentTenant?.id, user?.uid, isAuthenticated]);

  const userRole = tenantUser?.role || null;
  const isOwner = userRole === "owner";
  const isAdmin = userRole === "admin" || userRole === "owner";
  const hasAccess = tenantUser !== null && tenantUser.isActive;

  return {
    tenantUser,
    userRole,
    isOwner,
    isAdmin,
    hasAccess,
    isLoading,
    error,
    refetch: fetchTenantUser,
  };
}
