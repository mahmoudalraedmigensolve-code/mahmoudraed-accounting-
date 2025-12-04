"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { tenantUsersService } from "../services/tenant-users-service";
import { tenantsService } from "../services/tenants-service";
import { Tenant, TenantUserRole } from "../types";

interface UserTenantAccess {
  tenant: Tenant;
  role: TenantUserRole;
}

interface UseUserTenantsReturn {
  userTenants: UserTenantAccess[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserTenants(): UseUserTenantsReturn {
  const { user, isAuthenticated } = useAuthStore();
  const [userTenants, setUserTenants] = useState<UserTenantAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserTenants = async () => {
    if (!user || !isAuthenticated) {
      setUserTenants([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Find all tenants this user has access to
      const tenantAccess = await tenantUsersService.findUserTenants(user.uid);

      // Fetch full tenant data for each
      const tenantsWithAccess: UserTenantAccess[] = [];
      for (const access of tenantAccess) {
        const tenant = await tenantsService.fetchTenantById(access.tenantId);
        if (tenant && tenant.isActive) {
          tenantsWithAccess.push({
            tenant,
            role: access.role,
          });
        }
      }

      setUserTenants(tenantsWithAccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user tenants");
      setUserTenants([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTenants();
  }, [user?.uid, isAuthenticated]);

  return {
    userTenants,
    isLoading,
    error,
    refetch: fetchUserTenants,
  };
}
