"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenantsStore } from "@/features/tenants/store/tenants-store";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { tenantUsersService } from "@/features/tenants/services/tenant-users-service";
import { migrateDataToTenant } from "@/features/tenants/utils/create-moffex-tenant";
import { TenantUser, TenantUserRole, TenantFormData, DeviceInfo } from "@/features/tenants/types";
import { toast } from "sonner";
import { Smartphone, Trash2, RefreshCw, Lock, Eye, EyeOff } from "lucide-react";

// Admin credentials
const ADMIN_EMAIL = "moffa@gmail.com";
const ADMIN_PASSWORD = "Moffa Moffa 854";

export default function TenantAdminPage() {
  const { user } = useAuthStore();
  const { currentTenant, fetchAllTenants, tenants, setCurrentTenant, createTenant } = useTenantsStore();

  // Admin authentication
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Create tenant dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTenantData, setNewTenantData] = useState<TenantFormData>({
    name: "",
    slug: "",
    phone: "",
    email: "",
    address: "",
    logo: "",
    whatsappQRCode: "",
  });

  // Add user dialog
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    displayName: "",
    role: "user" as TenantUserRole,
    firebaseUid: "",
    maxDevices: 1,
  });

  // Handle admin login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (adminEmail === ADMIN_EMAIL && adminPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      // Store in session
      sessionStorage.setItem("adminAuth", "true");
    } else {
      setAuthError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
  };

  // Check session on mount
  useEffect(() => {
    const isAuth = sessionStorage.getItem("adminAuth");
    if (isAuth === "true") {
      setIsAdminAuthenticated(true);
    }
  }, []);

  // Fetch all tenants on mount
  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAllTenants();
    }
  }, [fetchAllTenants, isAdminAuthenticated]);

  // Fetch users when tenant changes
  useEffect(() => {
    if (currentTenant && isAdminAuthenticated) {
      loadTenantUsers();
    }
  }, [currentTenant, isAdminAuthenticated]);

  const loadTenantUsers = async () => {
    if (!currentTenant) return;
    setIsLoadingUsers(true);
    try {
      const users = await tenantUsersService.fetchTenantUsers(currentTenant.id);
      setTenantUsers(users);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenantData.name.trim() || !newTenantData.slug.trim()) {
      toast.error("يرجى إدخال اسم الشركة والـ Slug");
      return;
    }

    setIsCreating(true);
    try {
      const tenantId = await createTenant(newTenantData);

      // Add current user as owner
      if (user) {
        await tenantUsersService.addUserToTenant(tenantId, user.uid, {
          email: user.email || "",
          displayName: user.displayName || "",
          role: "owner",
          maxDevices: 3,
        });
      }

      toast.success(`تم إنشاء الشركة "${newTenantData.name}" بنجاح!`);
      setShowCreateDialog(false);
      setNewTenantData({
        name: "",
        slug: "",
        phone: "",
        email: "",
        address: "",
        logo: "",
        whatsappQRCode: "",
      });
      await fetchAllTenants();
    } catch (error: any) {
      toast.error(error.message || "فشل في إنشاء الشركة");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchTenant = async (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      toast.success(`تم التبديل إلى ${tenant.name}`);
    }
  };

  const handleMigrateData = async () => {
    if (!currentTenant) {
      toast.error("يجب اختيار شركة أولاً");
      return;
    }

    setIsMigrating(true);
    try {
      await migrateDataToTenant(currentTenant.id);
      toast.success("تم نقل البيانات بنجاح!");
    } catch (error: any) {
      toast.error(error.message || "فشل في نقل البيانات");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleAddUser = async () => {
    if (!currentTenant) {
      toast.error("يجب اختيار شركة أولاً");
      return;
    }

    if (!newUserData.email.trim() || !newUserData.firebaseUid.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني و Firebase UID");
      return;
    }

    setIsAddingUser(true);
    try {
      await tenantUsersService.addUserToTenant(currentTenant.id, newUserData.firebaseUid, {
        email: newUserData.email,
        displayName: newUserData.displayName,
        role: newUserData.role,
        maxDevices: newUserData.maxDevices,
      });
      toast.success("تم إضافة المستخدم بنجاح!");
      setShowAddUserDialog(false);
      setNewUserData({
        email: "",
        displayName: "",
        role: "user",
        firebaseUid: "",
        maxDevices: 1,
      });
      loadTenantUsers();
    } catch (error: any) {
      toast.error(error.message || "فشل في إضافة المستخدم");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: TenantUserRole) => {
    if (!currentTenant) return;
    try {
      await tenantUsersService.updateUserRole(currentTenant.id, userId, newRole);
      toast.success("تم تحديث الصلاحية بنجاح!");
      loadTenantUsers();
    } catch (error: any) {
      toast.error(error.message || "فشل في تحديث الصلاحية");
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    if (!currentTenant) return;
    try {
      if (isActive) {
        await tenantUsersService.deactivateUser(currentTenant.id, userId);
        toast.success("تم إلغاء تفعيل المستخدم");
      } else {
        await tenantUsersService.reactivateUser(currentTenant.id, userId);
        toast.success("تم تفعيل المستخدم");
      }
      loadTenantUsers();
    } catch (error: any) {
      toast.error(error.message || "فشل في تحديث حالة المستخدم");
    }
  };

  const handleUpdateMaxDevices = async (userId: string, maxDevices: number) => {
    if (!currentTenant) return;
    try {
      await tenantUsersService.updateMaxDevices(currentTenant.id, userId, maxDevices);
      toast.success("تم تحديث عدد الأجهزة بنجاح!");
      loadTenantUsers();
    } catch (error: any) {
      toast.error(error.message || "فشل في تحديث عدد الأجهزة");
    }
  };

  const handleClearDevices = async (userId: string) => {
    if (!currentTenant) return;
    if (!confirm("هل أنت متأكد من مسح جميع الأجهزة المسجلة؟ سيتمكن المستخدم من تسجيل الدخول من أجهزة جديدة.")) {
      return;
    }
    try {
      await tenantUsersService.clearAllDevices(currentTenant.id, userId);
      toast.success("تم مسح جميع الأجهزة بنجاح!");
      loadTenantUsers();
    } catch (error: any) {
      toast.error(error.message || "فشل في مسح الأجهزة");
    }
  };

  const handleRemoveDevice = async (userId: string, deviceId: string) => {
    if (!currentTenant) return;
    try {
      await tenantUsersService.removeDevice(currentTenant.id, userId, deviceId);
      toast.success("تم إزالة الجهاز بنجاح!");
      loadTenantUsers();
    } catch (error: any) {
      toast.error(error.message || "فشل في إزالة الجهاز");
    }
  };

  // Show admin login popup if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">دخول الأدمن</h1>
            <p className="text-slate-600 mt-2">يرجى إدخال بيانات الدخول للوصول لإدارة الشركات</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {authError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="adminEmail">البريد الإلكتروني</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@email.com"
                dir="ltr"
                className="text-left"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="adminPassword"
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="text-left pl-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full">
              دخول
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">إدارة الشركات (Admin)</h1>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.removeItem("adminAuth");
              setIsAdminAuthenticated(false);
            }}
          >
            تسجيل الخروج من الأدمن
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إنشاء شركة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg" dir="rtl">
              <DialogHeader>
                <DialogTitle>إنشاء شركة جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newName">اسم الشركة *</Label>
                    <Input
                      id="newName"
                      value={newTenantData.name}
                      onChange={(e) => setNewTenantData({ ...newTenantData, name: e.target.value })}
                      placeholder="اسم الشركة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newSlug">المعرف (Slug) *</Label>
                    <Input
                      id="newSlug"
                      value={newTenantData.slug}
                      onChange={(e) => setNewTenantData({ ...newTenantData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                      placeholder="company-name"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPhone">رقم الهاتف</Label>
                    <Input
                      id="newPhone"
                      value={newTenantData.phone}
                      onChange={(e) => setNewTenantData({ ...newTenantData, phone: e.target.value })}
                      placeholder="01xxxxxxxxx"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">البريد الإلكتروني</Label>
                    <Input
                      id="newEmail"
                      value={newTenantData.email}
                      onChange={(e) => setNewTenantData({ ...newTenantData, email: e.target.value })}
                      placeholder="email@company.com"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newAddress">العنوان</Label>
                  <Input
                    id="newAddress"
                    value={newTenantData.address}
                    onChange={(e) => setNewTenantData({ ...newTenantData, address: e.target.value })}
                    placeholder="عنوان الشركة"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleCreateTenant} disabled={isCreating} className="flex-1">
                    {isCreating ? "جاري الإنشاء..." : "إنشاء الشركة"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* All Tenants List */}
      <div className="rounded-lg border bg-card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">جميع الشركات ({tenants.length})</h2>
        {tenants.length === 0 ? (
          <p className="text-muted-foreground">لا توجد شركات بعد. أنشئ شركة جديدة للبدء.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  currentTenant?.id === tenant.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => handleSwitchTenant(tenant.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  {tenant.logo && (
                    <img src={tenant.logo} alt={tenant.name} className="w-10 h-10 object-contain rounded" />
                  )}
                  <div>
                    <h3 className="font-semibold">{tenant.name}</h3>
                    <p className="text-xs text-muted-foreground">{tenant.slug}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{tenant.phone || "بدون رقم هاتف"}</p>
                  <p className="text-xs mt-1 text-slate-400">ID: {tenant.id}</p>
                </div>
                {currentTenant?.id === tenant.id && (
                  <span className="inline-block mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
                    الشركة الحالية
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Tenant Management */}
      {currentTenant && (
        <>
          {/* Users Management */}
          <div className="rounded-lg border bg-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">مستخدمي الشركة: {currentTenant.name}</h2>
              <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة مستخدم
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إضافة مستخدم جديد</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="userEmail">البريد الإلكتروني *</Label>
                      <Input
                        id="userEmail"
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                        placeholder="user@email.com"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userFirebaseUid">Firebase UID *</Label>
                      <Input
                        id="userFirebaseUid"
                        value={newUserData.firebaseUid}
                        onChange={(e) => setNewUserData({ ...newUserData, firebaseUid: e.target.value })}
                        placeholder="Firebase Auth UID"
                        dir="ltr"
                      />
                      <p className="text-xs text-muted-foreground">
                        يمكن الحصول عليه من Firebase Console &gt; Authentication
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="userDisplayName">الاسم</Label>
                      <Input
                        id="userDisplayName"
                        value={newUserData.displayName}
                        onChange={(e) => setNewUserData({ ...newUserData, displayName: e.target.value })}
                        placeholder="اسم المستخدم"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="userRole">الصلاحية</Label>
                        <Select
                          value={newUserData.role}
                          onValueChange={(value: TenantUserRole) => setNewUserData({ ...newUserData, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">مستخدم</SelectItem>
                            <SelectItem value="admin">مدير</SelectItem>
                            <SelectItem value="owner">مالك</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxDevices">عدد الأجهزة المسموح</Label>
                        <Input
                          id="maxDevices"
                          type="number"
                          min={1}
                          value={newUserData.maxDevices}
                          onChange={(e) => setNewUserData({ ...newUserData, maxDevices: Math.max(1, parseInt(e.target.value) || 1) })}
                          placeholder="عدد الأجهزة"
                          dir="ltr"
                          className="text-center"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button onClick={handleAddUser} disabled={isAddingUser} className="flex-1">
                        {isAddingUser ? "جاري الإضافة..." : "إضافة المستخدم"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingUsers ? (
              <p className="text-muted-foreground">جاري تحميل المستخدمين...</p>
            ) : tenantUsers.length === 0 ? (
              <p className="text-muted-foreground">لا يوجد مستخدمين مضافين بعد.</p>
            ) : (
              <div className="space-y-4">
                {tenantUsers.map((tenantUser) => (
                  <div key={tenantUser.id} className="border rounded-lg p-4 bg-slate-50">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-semibold">{tenantUser.displayName || tenantUser.email}</h3>
                        <p className="text-sm text-muted-foreground">{tenantUser.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select
                          value={tenantUser.role}
                          onValueChange={(value: TenantUserRole) => handleUpdateUserRole(tenantUser.id, value)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">مستخدم</SelectItem>
                            <SelectItem value="admin">مدير</SelectItem>
                            <SelectItem value="owner">مالك</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className={`text-xs px-2 py-1 rounded ${tenantUser.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {tenantUser.isActive ? "نشط" : "غير نشط"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleUserStatus(tenantUser.id, tenantUser.isActive)}
                        >
                          {tenantUser.isActive ? "إلغاء التفعيل" : "تفعيل"}
                        </Button>
                      </div>
                    </div>

                    {/* Device Management */}
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">الأجهزة</span>
                          <span className="text-sm text-muted-foreground">
                            ({(tenantUser.registeredDevices || []).length} / {tenantUser.maxDevices || 1})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={tenantUser.maxDevices || 1}
                            onChange={(e) => {
                              const value = Math.max(1, parseInt(e.target.value) || 1);
                              handleUpdateMaxDevices(tenantUser.id, value);
                            }}
                            className="w-20 text-center"
                            dir="ltr"
                          />
                          <span className="text-sm text-muted-foreground">جهاز</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleClearDevices(tenantUser.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <RefreshCw className="w-4 h-4 ml-1" />
                            إعادة تعيين
                          </Button>
                        </div>
                      </div>

                      {(tenantUser.registeredDevices || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">لا توجد أجهزة مسجلة</p>
                      ) : (
                        <div className="space-y-2">
                          {(tenantUser.registeredDevices || []).map((device: DeviceInfo, idx: number) => (
                            <div key={device.deviceId || idx} className="flex items-center justify-between bg-slate-50 rounded p-2 text-sm">
                              <div>
                                <span className="font-medium">{device.deviceName || "جهاز غير معروف"}</span>
                                <span className="text-xs text-muted-foreground mr-2">
                                  ({device.deviceId?.substring(0, 15)}...)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  آخر نشاط: {device.lastActiveAt ? new Date(device.lastActiveAt).toLocaleDateString("ar-EG") : "-"}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveDevice(tenantUser.id, device.deviceId)}
                                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Migration */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">نقل البيانات</h2>
            <p className="text-muted-foreground mb-4">
              سيتم نقل جميع البيانات الموجودة حالياً (المبيعات، المشتريات، العملاء، الموردين، إلخ) إلى هيكل الشركة الجديد.
              <br />
              <strong className="text-amber-600">تحذير:</strong> تأكد من وجود نسخة احتياطية قبل المتابعة.
            </p>
            <Button
              onClick={handleMigrateData}
              disabled={isMigrating}
              variant="outline"
              className="border-amber-600 text-amber-600 hover:bg-amber-50"
            >
              {isMigrating ? "جاري نقل البيانات..." : "نقل البيانات إلى الشركة"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
