// Tenant Users Service - manages users within each tenant
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { TenantUser, TenantUserFormData, TenantUserRole, DeviceInfo } from "../types";

// Generate a unique device ID based on browser fingerprint
export const generateDeviceId = (): string => {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  if (!nav) return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const fingerprint = [
    nav.userAgent,
    nav.language,
    new Date().getTimezoneOffset(),
    screen?.width,
    screen?.height,
    screen?.colorDepth,
  ].join("|");

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `device_${Math.abs(hash).toString(36)}`;
};

// Get device name from user agent
export const getDeviceName = (): string => {
  if (typeof navigator === "undefined") return "Unknown Device";

  const ua = navigator.userAgent;
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Windows")) return "Windows PC";
  if (ua.includes("Mac")) return "Mac";
  if (ua.includes("Linux")) return "Linux PC";
  return "Unknown Device";
};

// Helper to get users collection path for a tenant
const getUsersPath = (tenantId: string) => `tenants/${tenantId}/users`;

export const tenantUsersService = {
  /**
   * Add a user to a tenant
   */
  async addUserToTenant(
    tenantId: string,
    firebaseUid: string,
    userData: TenantUserFormData
  ): Promise<string> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const docRef = await addDoc(collection(db, collectionPath), {
        tenantId,
        firebaseUid,
        email: userData.email,
        displayName: userData.displayName || "",
        role: userData.role,
        isActive: true,
        maxDevices: userData.maxDevices || 1,
        registeredDevices: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding user to tenant:", error);
      throw new Error("فشل في إضافة المستخدم");
    }
  },

  /**
   * Get all users for a tenant
   */
  async fetchTenantUsers(tenantId: string): Promise<TenantUser[]> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        // Convert registeredDevices timestamps
        const registeredDevices = (data.registeredDevices || []).map((device: any) => ({
          ...device,
          registeredAt: device.registeredAt?.toDate ? device.registeredAt.toDate() : device.registeredAt,
          lastActiveAt: device.lastActiveAt?.toDate ? device.lastActiveAt.toDate() : device.lastActiveAt,
        }));
        return {
          id: doc.id,
          ...data,
          registeredDevices,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as TenantUser;
      });
    } catch (error) {
      console.error("Error fetching tenant users:", error);
      throw new Error("فشل في جلب المستخدمين");
    }
  },

  /**
   * Get user by Firebase UID in a specific tenant
   */
  async getUserByFirebaseUid(
    tenantId: string,
    firebaseUid: string
  ): Promise<TenantUser | null> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const q = query(
        collection(db, collectionPath),
        where("firebaseUid", "==", firebaseUid)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      // Convert registeredDevices timestamps
      const registeredDevices = (data.registeredDevices || []).map((device: any) => ({
        ...device,
        registeredAt: device.registeredAt?.toDate ? device.registeredAt.toDate() : device.registeredAt,
        lastActiveAt: device.lastActiveAt?.toDate ? device.lastActiveAt.toDate() : device.lastActiveAt,
      }));
      return {
        id: doc.id,
        ...data,
        registeredDevices,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as TenantUser;
    } catch (error) {
      console.error("Error getting user by Firebase UID:", error);
      return null;
    }
  },

  /**
   * Find which tenants a user has access to (by Firebase UID)
   */
  async findUserTenants(firebaseUid: string): Promise<{ tenantId: string; role: TenantUserRole }[]> {
    try {
      // Get all tenants first
      const tenantsSnapshot = await getDocs(collection(db, "tenants"));
      const userTenants: { tenantId: string; role: TenantUserRole }[] = [];

      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenantId = tenantDoc.id;
        const user = await this.getUserByFirebaseUid(tenantId, firebaseUid);
        if (user && user.isActive) {
          userTenants.push({ tenantId, role: user.role });
        }
      }

      return userTenants;
    } catch (error) {
      console.error("Error finding user tenants:", error);
      return [];
    }
  },

  /**
   * Update user role
   */
  async updateUserRole(
    tenantId: string,
    userId: string,
    newRole: TenantUserRole
  ): Promise<void> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const userRef = doc(db, collectionPath, userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      throw new Error("فشل في تحديث صلاحية المستخدم");
    }
  },

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(tenantId: string, userId: string): Promise<void> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const userRef = doc(db, collectionPath, userId);
      await updateDoc(userRef, {
        isActive: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw new Error("فشل في إلغاء تفعيل المستخدم");
    }
  },

  /**
   * Reactivate user
   */
  async reactivateUser(tenantId: string, userId: string): Promise<void> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const userRef = doc(db, collectionPath, userId);
      await updateDoc(userRef, {
        isActive: true,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error reactivating user:", error);
      throw new Error("فشل في تفعيل المستخدم");
    }
  },

  /**
   * Remove user completely from tenant
   */
  async removeUser(tenantId: string, userId: string): Promise<void> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const userRef = doc(db, collectionPath, userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error("Error removing user:", error);
      throw new Error("فشل في حذف المستخدم");
    }
  },

  /**
   * Check if user has access to tenant
   */
  async checkUserAccess(tenantId: string, firebaseUid: string): Promise<boolean> {
    const user = await this.getUserByFirebaseUid(tenantId, firebaseUid);
    return user !== null && user.isActive;
  },

  /**
   * Check if device can access (device limit check)
   * Returns: { allowed: boolean, reason?: string }
   */
  async checkDeviceAccess(
    tenantId: string,
    firebaseUid: string,
    deviceId: string
  ): Promise<{ allowed: boolean; reason?: string; user?: TenantUser }> {
    try {
      const user = await this.getUserByFirebaseUid(tenantId, firebaseUid);

      if (!user) {
        return { allowed: false, reason: "المستخدم غير موجود" };
      }

      if (!user.isActive) {
        return { allowed: false, reason: "الحساب غير مفعل" };
      }

      const registeredDevices = user.registeredDevices || [];
      const maxDevices = user.maxDevices || 1;

      // Check if device is already registered
      const isDeviceRegistered = registeredDevices.some(
        (d) => d.deviceId === deviceId
      );

      if (isDeviceRegistered) {
        // Device is already registered, allow access
        return { allowed: true, user };
      }

      // Device not registered, check if there's room for more
      if (registeredDevices.length >= maxDevices) {
        return {
          allowed: false,
          reason: `لقد وصلت للحد الأقصى من الأجهزة (${maxDevices} جهاز). يرجى استخدام أحد الأجهزة المسجلة مسبقاً أو التواصل مع الدعم الفني.`,
          user,
        };
      }

      // There's room, allow access (device will be registered on login)
      return { allowed: true, user };
    } catch (error) {
      console.error("Error checking device access:", error);
      return { allowed: false, reason: "حدث خطأ أثناء التحقق" };
    }
  },

  /**
   * Register a new device for a user
   */
  async registerDevice(
    tenantId: string,
    userId: string,
    deviceInfo: DeviceInfo
  ): Promise<void> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const userRef = doc(db, collectionPath, userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error("المستخدم غير موجود");
      }

      const userData = userDoc.data();
      const registeredDevices: DeviceInfo[] = userData.registeredDevices || [];

      // Check if device already exists
      const existingIndex = registeredDevices.findIndex(
        (d) => d.deviceId === deviceInfo.deviceId
      );

      if (existingIndex >= 0) {
        // Update existing device's last active time
        registeredDevices[existingIndex].lastActiveAt = deviceInfo.lastActiveAt;
      } else {
        // Add new device
        registeredDevices.push(deviceInfo);
      }

      await updateDoc(userRef, {
        registeredDevices,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error registering device:", error);
      throw new Error("فشل في تسجيل الجهاز");
    }
  },

  /**
   * Update device last active time
   */
  async updateDeviceActivity(
    tenantId: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const userRef = doc(db, collectionPath, userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const registeredDevices: DeviceInfo[] = userData.registeredDevices || [];

      const deviceIndex = registeredDevices.findIndex(
        (d) => d.deviceId === deviceId
      );

      if (deviceIndex >= 0) {
        registeredDevices[deviceIndex].lastActiveAt = new Date();
        await updateDoc(userRef, {
          registeredDevices,
        });
      }
    } catch (error) {
      console.error("Error updating device activity:", error);
    }
  },

  /**
   * Remove a device from user's registered devices
   */
  async removeDevice(
    tenantId: string,
    userId: string,
    deviceId: string
  ): Promise<void> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const userRef = doc(db, collectionPath, userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error("المستخدم غير موجود");
      }

      const userData = userDoc.data();
      const registeredDevices: DeviceInfo[] = userData.registeredDevices || [];

      const updatedDevices = registeredDevices.filter(
        (d) => d.deviceId !== deviceId
      );

      await updateDoc(userRef, {
        registeredDevices: updatedDevices,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error removing device:", error);
      throw new Error("فشل في إزالة الجهاز");
    }
  },

  /**
   * Clear all registered devices for a user
   */
  async clearAllDevices(tenantId: string, userId: string): Promise<void> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const userRef = doc(db, collectionPath, userId);
      await updateDoc(userRef, {
        registeredDevices: [],
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error clearing devices:", error);
      throw new Error("فشل في مسح الأجهزة");
    }
  },

  /**
   * Update max devices for a user
   */
  async updateMaxDevices(
    tenantId: string,
    userId: string,
    maxDevices: number
  ): Promise<void> {
    try {
      const collectionPath = getUsersPath(tenantId);
      const userRef = doc(db, collectionPath, userId);
      await updateDoc(userRef, {
        maxDevices,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating max devices:", error);
      throw new Error("فشل في تحديث عدد الأجهزة");
    }
  },
};
