import { 
  type User, 
  type InsertUser, 
  type OtpCode,
  type InsertOtp,
  type Tenant,
  type InsertTenant,
  type Payment,
  type InsertPayment,
  type Notification,
  type InsertNotification,
  type Room,
  type InsertRoom,
  type PgMaster,
  type InsertPgMaster,
  type EmergencyContact,
  type InsertEmergencyContact,
  type Complaint,
  type InsertComplaint,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type PgSubscription,
  type InsertPgSubscription,
  type VisitRequest,
  type InsertVisitRequest,
  type OnboardingRequest,
  type InsertOnboardingRequest,
  type TenantHistory,
  type InsertTenantHistory,
  type ElectricityBillingCycle,
  type InsertElectricityBillingCycle,
  type ElectricityRoomBill,
  type InsertElectricityRoomBill,
  type ElectricityTenantCharge,
  type InsertElectricityTenantCharge,
  users,
  otpCodes,
  tenants,
  payments,
  notifications,
  rooms,
  pgMaster,
  emergencyContacts,
  complaints,
  subscriptionPlans,
  pgSubscriptions,
  visitRequests,
  onboardingRequests,
  tenantHistory,
  electricityBillingCycles,
  electricityRoomBills,
  electricityTenantCharges
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql, or, lte, isNull, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  
  // OTP
  createOtp(otp: InsertOtp): Promise<OtpCode>;
  getValidOtp(email: string, code: string): Promise<OtpCode | undefined>;
  deleteOtp(id: number): Promise<void>;
  
  // Tenants
  getTenants(ownerId: number, pgId?: number): Promise<Tenant[]>;
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantByUserId(userId: number): Promise<Tenant | undefined>;
  getActiveTenantByEmail(email: string): Promise<{tenant: Tenant, pg: PgMaster} | undefined>;
  getAvailableTenants(ownerId: number, pgId?: number): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, updates: Partial<Tenant>): Promise<Tenant | undefined>;
  deleteTenant(id: number, feedback?: { ownerFeedback?: string, rating?: number, behaviorTags?: string[], recordedByOwnerId: number }): Promise<void>;
  
  // Payments
  getPayment(id: number): Promise<Payment | undefined>;
  getPayments(ownerId: number, pgId?: number): Promise<Payment[]>;
  getPaymentsByTenant(tenantId: number): Promise<Payment[]>;
  getPendingApprovalPayments(ownerId: number, pgId?: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined>;
  approvePayment(id: number, ownerId: number): Promise<Payment | undefined>;
  rejectPayment(id: number, ownerId: number, rejectionReason?: string): Promise<Payment | undefined>;
  checkPaymentExistsForMonth(tenantId: number, pgId: number, paymentMonth: string): Promise<boolean>;
  generateAutoPaymentsForPg(pgId: number, ownerId: number): Promise<{ created: Payment[], skipped: number, notified: number, emailed: number }>;
  
  // Notifications
  getNotifications(userId: number, pgId?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;

  // Rooms
  getRooms(ownerId: number, pgId?: number): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<void>;
  getRoomWithTenant(roomId: number): Promise<any>;
  getAllRoomsWithTenants(ownerId: number, pgId?: number): Promise<any[]>;
  seedInitialRooms(ownerId: number, pgId?: number): Promise<void>;

  // PG Master
  getPgByOwnerId(ownerId: number): Promise<PgMaster | undefined>;
  getAllPgsByOwnerId(ownerId: number): Promise<PgMaster[]>;
  getPgById(pgId: number): Promise<PgMaster | undefined>;
  createPgMaster(pg: InsertPgMaster): Promise<PgMaster>;
  updatePgMaster(ownerId: number, updates: Partial<PgMaster>): Promise<PgMaster | undefined>;

  // Emergency Contacts
  getEmergencyContactsByTenant(tenantId: number): Promise<EmergencyContact[]>;
  createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact>;
  deleteEmergencyContact(id: number): Promise<void>;
  deleteEmergencyContactsByTenant(tenantId: number): Promise<void>;

  // Complaints
  getComplaints(ownerId: number, pgId?: number): Promise<Complaint[]>;
  getComplaintsByTenant(tenantId: number): Promise<Complaint[]>;
  getComplaint(id: number): Promise<Complaint | undefined>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaint(id: number, updates: Partial<Complaint>): Promise<Complaint | undefined>;
  deleteComplaint(id: number): Promise<void>;

  // Admin Methods
  adminExists(): Promise<boolean>;
  getAllPgs(): Promise<any[]>;
  getPendingPgs(): Promise<any[]>;
  approvePg(pgId: number, adminId: number): Promise<PgMaster | undefined>;
  rejectPg(pgId: number, adminId: number, reason: string): Promise<PgMaster | undefined>;
  deactivatePg(pgId: number): Promise<PgMaster | undefined>;
  activatePg(pgId: number): Promise<PgMaster | undefined>;
  updatePgById(pgId: number, updates: Partial<PgMaster>): Promise<PgMaster | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  getAllComplaints(): Promise<Complaint[]>;
  
  // Subscription Plans
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: number, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: number): Promise<void>;
  
  // PG Subscriptions
  getPgSubscriptions(pgId?: number): Promise<PgSubscription[]>;
  getPgSubscription(id: number): Promise<PgSubscription | undefined>;
  createPgSubscription(subscription: InsertPgSubscription): Promise<PgSubscription>;
  updatePgSubscription(id: number, updates: Partial<PgSubscription>): Promise<PgSubscription | undefined>;
  deletePgSubscription(id: number): Promise<void>;

  // PG Search Methods
  searchPgs(filters: { 
    searchQuery?: string;
    latitude?: number; 
    longitude?: number; 
    maxDistance?: number; 
    pgType?: string; 
    hasFood?: boolean; 
    hasParking?: boolean; 
    hasAC?: boolean; 
    hasCCTV?: boolean; 
    hasWifi?: boolean; 
    hasLaundry?: boolean; 
    hasGym?: boolean; 
    limit?: number; 
    offset?: number 
  }): Promise<any[]>;
  getPgWithRooms(pgId: number): Promise<any>;

  // Visit Request Methods
  createVisitRequest(data: InsertVisitRequest): Promise<VisitRequest>;
  getVisitRequest(id: number): Promise<VisitRequest | undefined>;
  getVisitRequestsByTenant(tenantUserId: number): Promise<any[]>;
  getVisitRequestsByOwner(ownerId: number, pgId?: number): Promise<any[]>;
  approveVisitRequest(id: number): Promise<VisitRequest | undefined>;
  rescheduleVisitRequest(id: number, newDate: Date, newTime: string, rescheduledBy: string): Promise<VisitRequest | undefined>;
  acceptReschedule(id: number): Promise<VisitRequest | undefined>;
  completeVisitRequest(id: number): Promise<VisitRequest | undefined>;
  cancelVisitRequest(id: number): Promise<VisitRequest | undefined>;

  // Onboarding Request Methods
  createOnboardingRequest(data: InsertOnboardingRequest): Promise<OnboardingRequest>;
  getOnboardingRequest(id: number): Promise<OnboardingRequest | undefined>;
  getOnboardingRequestsByOwner(ownerId: number, pgId?: number): Promise<OnboardingRequest[]>;
  getOnboardingRequestByTenant(tenantUserId: number, pgId: number): Promise<OnboardingRequest | undefined>;
  approveOnboardingRequest(id: number): Promise<OnboardingRequest | undefined>;
  rejectOnboardingRequest(id: number, reason: string): Promise<OnboardingRequest | undefined>;

  // Tenant History Methods
  createTenantHistory(data: InsertTenantHistory): Promise<TenantHistory>;
  getTenantHistory(tenantUserId: number): Promise<any[]>;
  updateTenantHistory(id: number, updates: Partial<TenantHistory>): Promise<TenantHistory | undefined>;

  // Electricity Billing Methods
  createElectricityBillingCycle(data: InsertElectricityBillingCycle): Promise<ElectricityBillingCycle>;
  getElectricityBillingCycle(id: number): Promise<ElectricityBillingCycle | undefined>;
  getElectricityBillingCycles(ownerId: number, pgId?: number): Promise<any[]>;
  updateElectricityBillingCycle(id: number, updates: Partial<ElectricityBillingCycle>): Promise<ElectricityBillingCycle | undefined>;
  createElectricityRoomBill(data: InsertElectricityRoomBill): Promise<ElectricityRoomBill>;
  getElectricityRoomBills(cycleId: number): Promise<any[]>;
  updateElectricityRoomBill(id: number, updates: Partial<ElectricityRoomBill>): Promise<ElectricityRoomBill | undefined>;
  getElectricityCycleSummary(cycleId: number): Promise<any>;
  confirmElectricityBillingCycle(cycleId: number, ownerId: number, dueDate?: Date): Promise<{ cycle: ElectricityBillingCycle, paymentsCreated: number, notificationsCreated: number }>;

  // Helper Methods
  checkTenantOnboardingStatus(userId: number): Promise<number | null>;
  getAvailableRoomsByPg(pgId: number): Promise<Room[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash password if provided
    if (insertUser.password) {
      insertUser.password = await bcrypt.hash(insertUser.password, 10);
    }
    
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    // Hash password if it's being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.password) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // OTP
  async createOtp(insertOtp: InsertOtp): Promise<OtpCode> {
    const result = await db.insert(otpCodes).values(insertOtp).returning();
    return result[0];
  }

  async getValidOtp(email: string, code: string): Promise<OtpCode | undefined> {
    const now = new Date();
    const result = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email),
          eq(otpCodes.code, code),
          gte(otpCodes.expiresAt, now)
        )
      )
      .limit(1);
    return result[0];
  }

  async deleteOtp(id: number): Promise<void> {
    await db.delete(otpCodes).where(eq(otpCodes.id, id));
  }

  // Tenants
  async getTenants(ownerId: number, pgId?: number): Promise<Tenant[]> {
    // Only return active tenants (not vacated ones)
    if (pgId) {
      return await db.select().from(tenants)
        .where(and(eq(tenants.ownerId, ownerId), eq(tenants.pgId, pgId), eq(tenants.status, "active")))
        .orderBy(desc(tenants.createdAt));
    }
    return await db.select().from(tenants)
      .where(and(eq(tenants.ownerId, ownerId), eq(tenants.status, "active")))
      .orderBy(desc(tenants.createdAt));
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return result[0];
  }

  async getTenantByUserId(userId: number): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants).where(eq(tenants.userId, userId)).limit(1);
    return result[0];
  }

  async getActiveTenantByEmail(email: string): Promise<{tenant: Tenant, pg: PgMaster} | undefined> {
    // Check if this email has an active tenant in ANY PG (across all owners)
    const result = await db.select({
      tenant: tenants,
      pg: pgMaster
    })
      .from(tenants)
      .innerJoin(pgMaster, eq(tenants.pgId, pgMaster.id))
      .where(and(
        eq(tenants.email, email),
        eq(tenants.status, "active")
      ))
      .limit(1);
    
    return result[0];
  }

  async getTenantByEmail(ownerId: number, email: string): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants)
      .where(and(eq(tenants.ownerId, ownerId), eq(tenants.email, email)))
      .limit(1);
    return result[0];
  }

  async getTenantByPhone(ownerId: number, phone: string): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants)
      .where(and(eq(tenants.ownerId, ownerId), eq(tenants.phone, phone)))
      .limit(1);
    return result[0];
  }

  async getTenantByEmailOrPhone(ownerId: number, identifier: string): Promise<Tenant | undefined> {
    // Try email first
    let tenant = await this.getTenantByEmail(ownerId, identifier);
    if (tenant) return tenant;
    // Try phone
    return await this.getTenantByPhone(ownerId, identifier);
  }

  async getAvailableTenants(ownerId: number, pgId?: number): Promise<Tenant[]> {
    // Get all active tenants for this owner that are not currently assigned to any room
    let roomsQuery;
    if (pgId) {
      roomsQuery = await db.select({ tenantIds: rooms.tenantIds }).from(rooms)
        .where(and(eq(rooms.ownerId, ownerId), eq(rooms.pgId, pgId)));
    } else {
      roomsQuery = await db.select({ tenantIds: rooms.tenantIds }).from(rooms).where(eq(rooms.ownerId, ownerId));
    }
    const assignedIds: number[] = [];
    roomsQuery.forEach(room => {
      if (room.tenantIds && Array.isArray(room.tenantIds)) {
        assignedIds.push(...room.tenantIds);
      }
    });
    
    let result;
    if (pgId) {
      result = await db.select().from(tenants)
        .where(and(eq(tenants.ownerId, ownerId), eq(tenants.pgId, pgId), eq(tenants.status, "active")))
        .orderBy(desc(tenants.createdAt));
    } else {
      result = await db.select().from(tenants)
        .where(and(eq(tenants.ownerId, ownerId), eq(tenants.status, "active")))
        .orderBy(desc(tenants.createdAt));
    }
    
    return result.filter(t => !assignedIds.includes(t.id));
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const result = await db.insert(tenants).values(tenant).returning();
    const createdTenant = result[0];
    
    // If tenant has a room assigned, update room's tenantIds
    if (createdTenant && tenant.roomNumber) {
      const room = await this.getRoomByNumber(tenant.ownerId, tenant.roomNumber, tenant.pgId || undefined);
      if (room) {
        const currentIds = Array.isArray(room.tenantIds) ? room.tenantIds : [];
        if (!currentIds.includes(createdTenant.id)) {
          await this.updateRoom(room.id, {
            tenantIds: [...currentIds, createdTenant.id]
          });
        }
      }
    }
    
    return createdTenant;
  }

  async updateTenant(id: number, updates: Partial<Tenant>): Promise<Tenant | undefined> {
    // Get the current tenant to check if room changed
    const currentTenant = await this.getTenant(id);
    if (!currentTenant) return undefined;

    const result = await db.update(tenants).set(updates).where(eq(tenants.id, id)).returning();
    const updatedTenant = result[0];

    // Handle room assignment if roomNumber was updated
    if (updates.roomNumber) {
      const tenantPgId = currentTenant.pgId || undefined;
      
      // Remove from old room if it exists and is different
      if (currentTenant.roomNumber && currentTenant.roomNumber !== updates.roomNumber) {
        const oldRoom = await this.getRoomByNumber(currentTenant.ownerId, currentTenant.roomNumber, tenantPgId);
        if (oldRoom && Array.isArray(oldRoom.tenantIds)) {
          await this.updateRoom(oldRoom.id, {
            tenantIds: oldRoom.tenantIds.filter(tid => tid !== id)
          });
        }
      }

      // Add to new room (either first assignment or room change)
      if (updatedTenant) {
        const newRoom = await this.getRoomByNumber(updatedTenant.ownerId, updates.roomNumber, tenantPgId);
        if (newRoom) {
          const currentIds = Array.isArray(newRoom.tenantIds) ? newRoom.tenantIds : [];
          // Add tenant ID if not already present
          if (!currentIds.includes(id)) {
            await this.updateRoom(newRoom.id, {
              tenantIds: [...currentIds, id]
            });
          }
        }
      }
    }

    return updatedTenant;
  }

  async deleteTenant(id: number, feedback?: { ownerFeedback?: string, rating?: number, behaviorTags?: string[], recordedByOwnerId: number }): Promise<void> {
    // Get tenant info before marking as vacated
    const tenant = await this.getTenant(id);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Check for pending payments
    const tenantPayments = await this.getPaymentsByTenant(id);
    const pendingPayments = tenantPayments.filter(
      (payment) => payment.status === "pending" || payment.status === "overdue"
    );
    
    if (pendingPayments.length > 0) {
      throw new Error("Cannot delete tenant with pending payments. Please settle all dues first.");
    }

    // Create history record if tenant has a user account and pgId
    // Always create history to track tenant lifecycle, even without feedback
    // Skip only if pgId is missing (tenant was never properly assigned to a PG)
    if (tenant.userId && tenant.pgId) {
      const historyData: InsertTenantHistory = {
        tenantUserId: tenant.userId,
        pgId: tenant.pgId,
        roomId: tenant.roomId || null,
        roomNumber: tenant.roomNumber,
        moveInDate: tenant.createdAt || new Date(), // Use tenant creation date as move-in
        moveOutDate: new Date(), // Current date as move-out
        ownerFeedback: feedback?.ownerFeedback || null,
        rating: feedback?.rating || null,
        behaviorTags: feedback?.behaviorTags || [],
        recordedByOwnerId: feedback?.recordedByOwnerId || tenant.ownerId, // Use tenant's owner if no feedback
        verificationStatus: "verified"
      };
      
      await this.createTenantHistory(historyData);
    }

    // Update user type back to applicant if tenant has a user account
    if (tenant.userId) {
      await db.update(users)
        .set({ userType: "applicant" })
        .where(eq(users.id, tenant.userId));
    }

    // Remove tenant from room's tenantIds array
    if (tenant.roomId) {
      const room = await this.getRoom(tenant.roomId);
      if (room && Array.isArray(room.tenantIds)) {
        const updatedTenantIds = room.tenantIds.filter(tid => tid !== id);
        await this.updateRoom(tenant.roomId, {
          tenantIds: updatedTenantIds
        });
      }
    }

    // Mark tenant as vacated instead of deleting
    // This preserves all references (payments, history) and simplifies data integrity
    await db.update(tenants)
      .set({ status: "vacated" })
      .where(eq(tenants.id, id));
  }

  // Payments
  async getPayment(id: number): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return result[0];
  }

  async getPayments(ownerId: number, pgId?: number): Promise<Payment[]> {
    let results;
    if (pgId) {
      results = await db.select({
        payment: payments,
        tenant: tenants
      }).from(payments)
        .leftJoin(tenants, eq(payments.tenantId, tenants.id))
        .where(and(eq(payments.ownerId, ownerId), eq(payments.pgId, pgId)))
        .orderBy(desc(payments.createdAt));
    } else {
      results = await db.select({
        payment: payments,
        tenant: tenants
      }).from(payments)
        .leftJoin(tenants, eq(payments.tenantId, tenants.id))
        .where(eq(payments.ownerId, ownerId))
        .orderBy(desc(payments.createdAt));
    }
    
    // Flatten the joined data
    return results.map((r: any) => ({
      ...r.payment,
      tenant: r.tenant ? {
        id: r.tenant.id,
        name: r.tenant.name,
        roomNumber: r.tenant.roomNumber
      } : null
    })) as Payment[];
  }

  async getPaymentsByTenant(tenantId: number): Promise<Payment[]> {
    const results = await db.select({
      payment: payments,
      tenant: tenants
    }).from(payments)
      .leftJoin(tenants, eq(payments.tenantId, tenants.id))
      .where(eq(payments.tenantId, tenantId))
      .orderBy(desc(payments.createdAt));
    
    // Flatten the joined data
    return results.map((r: any) => ({
      ...r.payment,
      tenant: r.tenant ? {
        id: r.tenant.id,
        name: r.tenant.name,
        roomNumber: r.tenant.roomNumber
      } : null
    })) as Payment[];
  }

  async getPendingApprovalPayments(ownerId: number, pgId?: number): Promise<Payment[]> {
    let results;
    if (pgId) {
      results = await db.select({
        payment: payments,
        tenant: tenants
      }).from(payments)
        .leftJoin(tenants, eq(payments.tenantId, tenants.id))
        .where(and(
          eq(payments.ownerId, ownerId), 
          eq(payments.pgId, pgId),
          eq(payments.status, "pending_approval")
        ))
        .orderBy(desc(payments.createdAt));
    } else {
      results = await db.select({
        payment: payments,
        tenant: tenants
      }).from(payments)
        .leftJoin(tenants, eq(payments.tenantId, tenants.id))
        .where(and(eq(payments.ownerId, ownerId), eq(payments.status, "pending_approval")))
        .orderBy(desc(payments.createdAt));
    }
    
    // Flatten the joined data
    return results.map((r: any) => ({
      ...r.payment,
      tenant: r.tenant ? {
        id: r.tenant.id,
        name: r.tenant.name,
        roomNumber: r.tenant.roomNumber
      } : null
    })) as Payment[];
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined> {
    const result = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return result[0];
  }

  async approvePayment(id: number, ownerId: number): Promise<Payment | undefined> {
    // Verify ownership before approving
    const payment = await this.getPayment(id);
    if (!payment || payment.ownerId !== ownerId) {
      return undefined;
    }

    const result = await db.update(payments)
      .set({ 
        status: "paid",
        paidAt: new Date(),
        rejectionReason: null  // Clear rejection reason on approval
      })
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  async rejectPayment(id: number, ownerId: number, rejectionReason?: string): Promise<Payment | undefined> {
    // Verify ownership before rejecting
    const payment = await this.getPayment(id);
    if (!payment || payment.ownerId !== ownerId) {
      return undefined;
    }

    const result = await db.update(payments)
      .set({ 
        status: "pending",
        transactionId: null,
        paymentMethod: null,
        rejectionReason: rejectionReason || null
      })
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  async checkPaymentExistsForMonth(tenantId: number, pgId: number, paymentMonth: string): Promise<boolean> {
    const existingPayment = await db.select().from(payments)
      .where(and(
        eq(payments.tenantId, tenantId),
        eq(payments.pgId, pgId),
        eq(payments.paymentMonth, paymentMonth)
      ))
      .limit(1);
    return existingPayment.length > 0;
  }

  async generateAutoPaymentsForPg(pgId: number, ownerId: number): Promise<{ created: Payment[], skipped: number, notified: number, emailed: number }> {
    const pg = await this.getPgById(pgId);
    if (!pg || !pg.rentPaymentDate) {
      return { created: [], skipped: 0, notified: 0, emailed: 0 };
    }

    // Get only active tenants for payment generation
    const pgTenants = await db.select().from(tenants)
      .where(and(eq(tenants.pgId, pgId), eq(tenants.ownerId, ownerId), eq(tenants.status, "active")));

    const createdPayments: Payment[] = [];
    let skippedCount = 0;
    let notifiedCount = 0;
    let emailedCount = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const paymentMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // Determine due date
    let dueDate = new Date(currentYear, currentMonth, pg.rentPaymentDate);
    if (dueDate < now) {
      dueDate = new Date(currentYear, currentMonth + 1, pg.rentPaymentDate);
    }

    // Setup email transporter only if credentials are available
    let transporter = null;
    if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
      try {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });
      } catch (error) {
        console.error('Failed to create email transporter:', error);
      }
    }

    for (const tenant of pgTenants) {
      const paymentExists = await this.checkPaymentExistsForMonth(tenant.id, pgId, paymentMonth);
      
      if (paymentExists) {
        skippedCount++;
        continue;
      }

      // Create payment - tenantId will always be valid since we're not deleting tenants
      const payment = await this.createPayment({
        tenantId: tenant.id,
        ownerId: ownerId,
        pgId: pgId,
        amount: tenant.monthlyRent.toString(),
        type: "rent",
        status: "pending",
        dueDate: dueDate,
        paymentMonth: paymentMonth,
        generatedAt: now
      });
      createdPayments.push(payment);

      // Create in-app notification if tenant has userId
      if (tenant.userId) {
        try {
          await this.createNotification({
            userId: tenant.userId,
            title: "New Rent Payment Request",
            message: `Your rent payment of ₹${tenant.monthlyRent} for ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} is now due. Please pay by ${dueDate.toLocaleDateString()}.`,
            type: "rent_reminder"
          });
          notifiedCount++;
        } catch (error) {
          console.error(`Failed to create notification for tenant ${tenant.id}:`, error);
        }
      }

      // Send email if tenant has email and transporter is available
      if (tenant.email && tenant.email.trim() && transporter) {
        try {
          await transporter.sendMail({
            from: process.env.GMAIL_EMAIL,
            to: tenant.email,
            subject: `Rent Payment Due - ${pg.pgName}`,
            html: `
              <h2>Rent Payment Request</h2>
              <p>Dear ${tenant.name},</p>
              <p>Your monthly rent payment for <strong>${pg.pgName}</strong> is now due.</p>
              <ul>
                <li><strong>Amount:</strong> ₹${tenant.monthlyRent}</li>
                <li><strong>Month:</strong> ${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</li>
                <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</li>
              </ul>
              <p>Please log in to your dashboard to make the payment.</p>
              <p>Thank you!</p>
            `
          });
          emailedCount++;
        } catch (error) {
          console.error(`Failed to send email to tenant ${tenant.id} (${tenant.email}):`, error);
        }
      }
    }

    // Update PG tracking fields
    await db.update(pgMaster)
      .set({
        lastPaymentGeneratedAt: now,
        lastPaymentGeneratedMonth: paymentMonth
      })
      .where(eq(pgMaster.id, pgId));

    return { created: createdPayments, skipped: skippedCount, notified: notifiedCount, emailed: emailedCount };
  }

  // Notifications
  async getNotifications(userId: number, pgId?: number): Promise<Notification[]> {
    // Note: notifications table doesn't have pgId field, so we ignore the pgId parameter
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  // Rooms
  async getRooms(ownerId: number, pgId?: number): Promise<Room[]> {
    if (pgId) {
      return await db.select().from(rooms)
        .where(and(eq(rooms.ownerId, ownerId), eq(rooms.pgId, pgId)))
        .orderBy(desc(rooms.createdAt));
    }
    return await db.select().from(rooms).where(eq(rooms.ownerId, ownerId)).orderBy(desc(rooms.createdAt));
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return result[0];
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const result = await db.insert(rooms).values(room).returning();
    return result[0];
  }

  async updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined> {
    const result = await db.update(rooms).set(updates).where(eq(rooms.id, id)).returning();
    return result[0];
  }

  async deleteRoom(id: number): Promise<void> {
    await db.delete(rooms).where(eq(rooms.id, id));
  }

  async getRoomWithTenant(roomId: number): Promise<any> {
    // Get room with its tenants using the tenantIds array
    const room = await this.getRoom(roomId);
    if (!room) return undefined;
    
    let tenants: any[] = [];
    if (room.tenantIds && Array.isArray(room.tenantIds) && room.tenantIds.length > 0) {
      tenants = await Promise.all(
        room.tenantIds.map(id => this.getTenant(id))
      );
      tenants = tenants.filter(Boolean);
    }
    
    return { room, tenants };
  }

  async getRoomByNumber(ownerId: number, roomNumber: string, pgId?: number): Promise<Room | undefined> {
    if (pgId) {
      const result = await db.select().from(rooms)
        .where(and(eq(rooms.ownerId, ownerId), eq(rooms.pgId, pgId), eq(rooms.roomNumber, roomNumber)))
        .limit(1);
      return result[0];
    }
    const result = await db.select().from(rooms)
      .where(and(eq(rooms.ownerId, ownerId), eq(rooms.roomNumber, roomNumber)))
      .limit(1);
    return result[0];
  }

  async getAllRoomsWithTenants(ownerId: number, pgId?: number): Promise<any[]> {
    try {
      let result;
      if (pgId) {
        result = await db
          .select()
          .from(rooms)
          .where(and(eq(rooms.ownerId, ownerId), eq(rooms.pgId, pgId)))
          .orderBy(desc(rooms.createdAt));
      } else {
        result = await db
          .select()
          .from(rooms)
          .where(eq(rooms.ownerId, ownerId))
          .orderBy(desc(rooms.createdAt));
      }
      
      // Fetch tenant data for each room
      const roomsWithTenants = await Promise.all(
        result.map(async (room) => {
          let tenants: any[] = [];
          if (room.tenantIds && Array.isArray(room.tenantIds) && room.tenantIds.length > 0) {
            tenants = await Promise.all(
              room.tenantIds.map(id => this.getTenant(id))
            );
            tenants = tenants.filter(Boolean);
          }
          
          // Calculate status dynamically based on actual tenant count
          let status = "vacant";
          if (tenants.length > 0 && room.sharing) {
            if (tenants.length >= room.sharing) {
              status = "occupied";
            } else {
              status = "partially_occupied";
            }
          }
          
          return { room: { ...room, status }, tenants };
        })
      );
      
      return roomsWithTenants;
    } catch (error) {
      console.error("Error fetching rooms with tenants:", error);
      return [];
    }
  }

  async seedInitialRooms(ownerId: number, pgId?: number): Promise<void> {
    const seedData = [
      { roomNumber: "101", monthlyRent: "5000", sharing: 1, floor: 1, hasAttachedBathroom: true, hasAC: true, amenities: ["WiFi", "Water", "Power"] },
      { roomNumber: "102", monthlyRent: "6500", sharing: 2, floor: 1, hasAttachedBathroom: false, hasAC: false, amenities: ["WiFi", "Water", "Power"] },
      { roomNumber: "201", monthlyRent: "7000", sharing: 3, floor: 2, hasAttachedBathroom: false, hasAC: false, amenities: ["WiFi", "Water", "Power"] },
      { roomNumber: "202", monthlyRent: "5500", sharing: 2, floor: 2, hasAttachedBathroom: true, hasAC: false, amenities: ["WiFi", "Water", "Power"] },
      { roomNumber: "301", monthlyRent: "8000", sharing: 1, floor: 3, hasAttachedBathroom: true, hasAC: true, amenities: ["WiFi", "Water", "Power"] },
      { roomNumber: "302", monthlyRent: "8000", sharing: 3, floor: 3, hasAttachedBathroom: false, hasAC: false, amenities: ["WiFi", "Water", "Power"] },
    ];

    for (const data of seedData) {
      await this.createRoom({
        ownerId,
        pgId,
        roomNumber: data.roomNumber,
        monthlyRent: data.monthlyRent,
        tenantIds: [],
        sharing: data.sharing,
        floor: data.floor,
        hasAttachedBathroom: data.hasAttachedBathroom,
        hasAC: data.hasAC,
        status: "vacant",
        amenities: data.amenities,
      });
    }
  }

  // PG Master
  async getPgByOwnerId(ownerId: number): Promise<PgMaster | undefined> {
    const result = await db.select().from(pgMaster).where(eq(pgMaster.ownerId, ownerId)).limit(1);
    return result[0];
  }

  async getAllPgsByOwnerId(ownerId: number): Promise<PgMaster[]> {
    return await db.select().from(pgMaster).where(eq(pgMaster.ownerId, ownerId)).orderBy(desc(pgMaster.createdAt));
  }

  async getPgById(pgId: number): Promise<PgMaster | undefined> {
    const result = await db.select().from(pgMaster).where(eq(pgMaster.id, pgId)).limit(1);
    return result[0];
  }

  async createPgMaster(pg: InsertPgMaster): Promise<PgMaster> {
    const result = await db.insert(pgMaster).values(pg).returning();
    return result[0];
  }

  async updatePgMaster(ownerId: number, updates: Partial<PgMaster>): Promise<PgMaster | undefined> {
    const result = await db.update(pgMaster).set(updates).where(eq(pgMaster.ownerId, ownerId)).returning();
    return result[0];
  }

  async updatePgMasterById(pgId: number, updates: Partial<PgMaster>): Promise<PgMaster | undefined> {
    const result = await db.update(pgMaster).set(updates).where(eq(pgMaster.id, pgId)).returning();
    return result[0];
  }

  async deletePgMaster(pgId: number): Promise<void> {
    await db.delete(pgMaster).where(eq(pgMaster.id, pgId));
  }

  // Emergency Contacts
  async getEmergencyContactsByTenant(tenantId: number): Promise<EmergencyContact[]> {
    return await db.select().from(emergencyContacts).where(eq(emergencyContacts.tenantId, tenantId)).orderBy(desc(emergencyContacts.createdAt));
  }

  async createEmergencyContact(contact: InsertEmergencyContact): Promise<EmergencyContact> {
    const result = await db.insert(emergencyContacts).values(contact).returning();
    return result[0];
  }

  async deleteEmergencyContact(id: number): Promise<void> {
    await db.delete(emergencyContacts).where(eq(emergencyContacts.id, id));
  }

  async deleteEmergencyContactsByTenant(tenantId: number): Promise<void> {
    await db.delete(emergencyContacts).where(eq(emergencyContacts.tenantId, tenantId));
  }

  // Complaints
  async getComplaints(ownerId: number, pgId?: number): Promise<Complaint[]> {
    if (pgId) {
      return await db.select().from(complaints)
        .where(and(eq(complaints.ownerId, ownerId), eq(complaints.pgId, pgId)))
        .orderBy(desc(complaints.createdAt));
    }
    return await db.select().from(complaints)
      .where(eq(complaints.ownerId, ownerId))
      .orderBy(desc(complaints.createdAt));
  }

  async getComplaintsByTenant(tenantId: number): Promise<Complaint[]> {
    return await db.select().from(complaints)
      .where(eq(complaints.tenantId, tenantId))
      .orderBy(desc(complaints.createdAt));
  }

  async getComplaint(id: number): Promise<Complaint | undefined> {
    const result = await db.select().from(complaints).where(eq(complaints.id, id)).limit(1);
    return result[0];
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const result = await db.insert(complaints).values(complaint).returning();
    return result[0];
  }

  async updateComplaint(id: number, updates: Partial<Complaint>): Promise<Complaint | undefined> {
    const result = await db.update(complaints).set(updates).where(eq(complaints.id, id)).returning();
    return result[0];
  }

  async deleteComplaint(id: number): Promise<void> {
    await db.delete(complaints).where(eq(complaints.id, id));
  }

  // Admin Methods
  async adminExists(): Promise<boolean> {
    const result = await db.select().from(users).where(eq(users.userType, "admin")).limit(1);
    return result.length > 0;
  }

  async getAllPgs(): Promise<any[]> {
    const results = await db
      .select({
        id: pgMaster.id,
        ownerId: pgMaster.ownerId,
        pgName: pgMaster.pgName,
        pgAddress: pgMaster.pgAddress,
        pgLocation: pgMaster.pgLocation,
        latitude: pgMaster.latitude,
        longitude: pgMaster.longitude,
        imageUrl: pgMaster.imageUrl,
        totalRooms: pgMaster.totalRooms,
        rentPaymentDate: pgMaster.rentPaymentDate,
        status: pgMaster.status,
        approvedBy: pgMaster.approvedBy,
        approvedAt: pgMaster.approvedAt,
        rejectionReason: pgMaster.rejectionReason,
        isActive: pgMaster.isActive,
        subscriptionStatus: pgMaster.subscriptionStatus,
        subscriptionExpiresAt: pgMaster.subscriptionExpiresAt,
        createdAt: pgMaster.createdAt,
        owner: {
          id: users.id,
          name: users.name,
          email: users.email,
          mobile: users.mobile,
        },
      })
      .from(pgMaster)
      .innerJoin(users, eq(pgMaster.ownerId, users.id))
      .orderBy(desc(pgMaster.createdAt));
    
    return results;
  }

  async getPendingPgs(): Promise<any[]> {
    const results = await db
      .select({
        id: pgMaster.id,
        ownerId: pgMaster.ownerId,
        pgName: pgMaster.pgName,
        pgAddress: pgMaster.pgAddress,
        pgLocation: pgMaster.pgLocation,
        latitude: pgMaster.latitude,
        longitude: pgMaster.longitude,
        imageUrl: pgMaster.imageUrl,
        totalRooms: pgMaster.totalRooms,
        rentPaymentDate: pgMaster.rentPaymentDate,
        status: pgMaster.status,
        approvedBy: pgMaster.approvedBy,
        approvedAt: pgMaster.approvedAt,
        rejectionReason: pgMaster.rejectionReason,
        isActive: pgMaster.isActive,
        subscriptionStatus: pgMaster.subscriptionStatus,
        subscriptionExpiresAt: pgMaster.subscriptionExpiresAt,
        createdAt: pgMaster.createdAt,
        owner: {
          id: users.id,
          name: users.name,
          email: users.email,
          mobile: users.mobile,
        },
      })
      .from(pgMaster)
      .innerJoin(users, eq(pgMaster.ownerId, users.id))
      .where(eq(pgMaster.status, "pending"))
      .orderBy(desc(pgMaster.createdAt));
    
    return results;
  }

  async approvePg(pgId: number, adminId: number): Promise<PgMaster | undefined> {
    const result = await db.update(pgMaster)
      .set({ 
        status: "approved", 
        approvedBy: adminId, 
        approvedAt: new Date() 
      })
      .where(eq(pgMaster.id, pgId))
      .returning();
    return result[0];
  }

  async rejectPg(pgId: number, adminId: number, reason: string): Promise<PgMaster | undefined> {
    const result = await db.update(pgMaster)
      .set({ 
        status: "rejected", 
        approvedBy: adminId, 
        approvedAt: new Date(),
        rejectionReason: reason,
        isActive: false
      })
      .where(eq(pgMaster.id, pgId))
      .returning();
    return result[0];
  }

  async deactivatePg(pgId: number): Promise<PgMaster | undefined> {
    const result = await db.update(pgMaster)
      .set({ isActive: false })
      .where(eq(pgMaster.id, pgId))
      .returning();
    return result[0];
  }

  async activatePg(pgId: number): Promise<PgMaster | undefined> {
    const result = await db.update(pgMaster)
      .set({ isActive: true })
      .where(eq(pgMaster.id, pgId))
      .returning();
    return result[0];
  }

  async updatePgById(pgId: number, updates: Partial<PgMaster>): Promise<PgMaster | undefined> {
    const result = await db.update(pgMaster)
      .set(updates)
      .where(eq(pgMaster.id, pgId))
      .returning();
    return result[0];
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async getAllComplaints(): Promise<Complaint[]> {
    return await db.select().from(complaints).orderBy(desc(complaints.createdAt));
  }

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(desc(subscriptionPlans.createdAt));
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
    return result[0];
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const result = await db.insert(subscriptionPlans).values(plan).returning();
    return result[0];
  }

  async updateSubscriptionPlan(id: number, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const result = await db.update(subscriptionPlans)
      .set(updates)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return result[0];
  }

  async deleteSubscriptionPlan(id: number): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }

  // PG Subscriptions
  async getPgSubscriptions(pgId?: number): Promise<PgSubscription[]> {
    if (pgId) {
      return await db.select().from(pgSubscriptions)
        .where(eq(pgSubscriptions.pgId, pgId))
        .orderBy(desc(pgSubscriptions.createdAt));
    }
    return await db.select().from(pgSubscriptions).orderBy(desc(pgSubscriptions.createdAt));
  }

  async getPgSubscription(id: number): Promise<PgSubscription | undefined> {
    const result = await db.select().from(pgSubscriptions).where(eq(pgSubscriptions.id, id)).limit(1);
    return result[0];
  }

  async createPgSubscription(subscription: InsertPgSubscription): Promise<PgSubscription> {
    const result = await db.insert(pgSubscriptions).values(subscription).returning();
    return result[0];
  }

  async updatePgSubscription(id: number, updates: Partial<PgSubscription>): Promise<PgSubscription | undefined> {
    const result = await db.update(pgSubscriptions)
      .set(updates)
      .where(eq(pgSubscriptions.id, id))
      .returning();
    return result[0];
  }

  async deletePgSubscription(id: number): Promise<void> {
    await db.delete(pgSubscriptions).where(eq(pgSubscriptions.id, id));
  }

  // PG Search Methods
  async searchPgs(filters: { 
    searchQuery?: string;
    latitude?: number; 
    longitude?: number; 
    maxDistance?: number; 
    pgType?: string; 
    hasFood?: boolean; 
    hasParking?: boolean; 
    hasAC?: boolean; 
    hasCCTV?: boolean; 
    hasWifi?: boolean; 
    hasLaundry?: boolean; 
    hasGym?: boolean; 
    limit?: number; 
    offset?: number 
  }): Promise<any[]> {
    const { 
      searchQuery,
      latitude, 
      longitude, 
      maxDistance = 50, 
      pgType, 
      hasFood, 
      hasParking, 
      hasAC, 
      hasCCTV, 
      hasWifi, 
      hasLaundry, 
      hasGym,
      limit = 20,
      offset = 0
    } = filters;

    let conditions = [eq(pgMaster.status, "approved"), eq(pgMaster.isActive, true)];

    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      conditions.push(
        or(
          sql`${pgMaster.pgName} ILIKE ${searchPattern}`,
          sql`${pgMaster.pgLocation} ILIKE ${searchPattern}`,
          sql`${pgMaster.pgAddress} ILIKE ${searchPattern}`
        )!
      );
    }

    if (pgType) {
      conditions.push(eq(pgMaster.pgType, pgType));
    }
    if (hasFood !== undefined) {
      conditions.push(eq(pgMaster.hasFood, hasFood));
    }
    if (hasParking !== undefined) {
      conditions.push(eq(pgMaster.hasParking, hasParking));
    }
    if (hasAC !== undefined) {
      conditions.push(eq(pgMaster.hasAC, hasAC));
    }
    if (hasCCTV !== undefined) {
      conditions.push(eq(pgMaster.hasCCTV, hasCCTV));
    }
    if (hasWifi !== undefined) {
      conditions.push(eq(pgMaster.hasWifi, hasWifi));
    }
    if (hasLaundry !== undefined) {
      conditions.push(eq(pgMaster.hasLaundry, hasLaundry));
    }
    if (hasGym !== undefined) {
      conditions.push(eq(pgMaster.hasGym, hasGym));
    }

    let query = db.select().from(pgMaster);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const pgs = await query;

    let results = pgs.map(pg => {
      let distance = null;
      
      if (latitude !== undefined && longitude !== undefined && pg.latitude && pg.longitude) {
        const lat1 = parseFloat(pg.latitude.toString());
        const lon1 = parseFloat(pg.longitude.toString());
        const lat2 = latitude;
        const lon2 = longitude;
        
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      }

      return {
        ...pg,
        distance
      };
    });

    if (latitude !== undefined && longitude !== undefined) {
      results = results.filter(pg => pg.distance !== null && pg.distance <= maxDistance);
      
      results.sort((a, b) => {
        if (a.distance !== b.distance) {
          return (a.distance || 0) - (b.distance || 0);
        }
        const ratingA = parseFloat(a.averageRating?.toString() || "0");
        const ratingB = parseFloat(b.averageRating?.toString() || "0");
        return ratingB - ratingA;
      });
    } else {
      results.sort((a, b) => {
        const ratingA = parseFloat(a.averageRating?.toString() || "0");
        const ratingB = parseFloat(b.averageRating?.toString() || "0");
        return ratingB - ratingA;
      });
    }

    return results.slice(offset, offset + limit);
  }

  async getPgWithRooms(pgId: number): Promise<any> {
    const pg = await this.getPgById(pgId);
    if (!pg) return null;

    const availableRooms = await this.getAvailableRoomsByPg(pgId);

    return {
      ...pg,
      availableRooms
    };
  }

  // Visit Request Methods
  async createVisitRequest(data: InsertVisitRequest): Promise<VisitRequest> {
    const existingRequest = await db.select()
      .from(visitRequests)
      .where(
        and(
          eq(visitRequests.tenantUserId, data.tenantUserId),
          eq(visitRequests.pgId, data.pgId),
          or(
            eq(visitRequests.status, "pending"),
            eq(visitRequests.status, "approved"),
            eq(visitRequests.status, "rescheduled")
          )
        )
      )
      .limit(1);

    if (existingRequest.length > 0) {
      throw new Error("You already have a pending visit request for this PG");
    }

    const result = await db.insert(visitRequests).values(data).returning();
    return result[0];
  }

  async getVisitRequestsByTenant(tenantUserId: number): Promise<any[]> {
    const results = await db.select({
      visitRequest: visitRequests,
      pgName: pgMaster.pgName,
      pgAddress: pgMaster.pgAddress,
      roomNumber: rooms.roomNumber,
    })
      .from(visitRequests)
      .leftJoin(pgMaster, eq(visitRequests.pgId, pgMaster.id))
      .leftJoin(rooms, eq(visitRequests.roomId, rooms.id))
      .where(eq(visitRequests.tenantUserId, tenantUserId))
      .orderBy(desc(visitRequests.createdAt));

    return results.map(row => ({
      ...row.visitRequest,
      pgName: row.pgName,
      pgAddress: row.pgAddress,
      roomNumber: row.roomNumber,
    }));
  }

  async getVisitRequestsByOwner(ownerId: number, pgId?: number): Promise<any[]> {
    const conditions = [eq(visitRequests.ownerId, ownerId)];
    if (pgId) {
      conditions.push(eq(visitRequests.pgId, pgId));
    }

    const results = await db.select({
      visitRequest: visitRequests,
      pgName: pgMaster.pgName,
      pgAddress: pgMaster.pgAddress,
      roomNumber: rooms.roomNumber,
      tenantName: users.name,
      tenantEmail: users.email,
    })
      .from(visitRequests)
      .leftJoin(pgMaster, eq(visitRequests.pgId, pgMaster.id))
      .leftJoin(rooms, eq(visitRequests.roomId, rooms.id))
      .leftJoin(users, eq(visitRequests.tenantUserId, users.id))
      .where(and(...conditions))
      .orderBy(desc(visitRequests.createdAt));

    return results.map(row => ({
      ...row.visitRequest,
      pgName: row.pgName,
      pgAddress: row.pgAddress,
      roomNumber: row.roomNumber,
      tenantName: row.tenantName,
      tenantEmail: row.tenantEmail,
    }));
  }

  async getVisitRequest(id: number): Promise<VisitRequest | undefined> {
    const result = await db.select()
      .from(visitRequests)
      .where(eq(visitRequests.id, id))
      .limit(1);
    return result[0];
  }

  async approveVisitRequest(id: number): Promise<VisitRequest | undefined> {
    const request = await db.select()
      .from(visitRequests)
      .where(eq(visitRequests.id, id))
      .limit(1);

    if (!request[0]) return undefined;

    const result = await db.update(visitRequests)
      .set({ 
        status: "approved",
        confirmedDate: request[0].requestedDate,
        confirmedTime: request[0].requestedTime,
        updatedAt: new Date()
      })
      .where(eq(visitRequests.id, id))
      .returning();
    
    return result[0];
  }

  async rescheduleVisitRequest(id: number, newDate: Date, newTime: string, rescheduledBy: string): Promise<VisitRequest | undefined> {
    const result = await db.update(visitRequests)
      .set({ 
        status: "rescheduled",
        rescheduledDate: newDate,
        rescheduledTime: newTime,
        rescheduledBy: rescheduledBy,
        updatedAt: new Date()
      })
      .where(eq(visitRequests.id, id))
      .returning();
    
    return result[0];
  }

  async acceptReschedule(id: number): Promise<VisitRequest | undefined> {
    const request = await db.select()
      .from(visitRequests)
      .where(eq(visitRequests.id, id))
      .limit(1);

    if (!request[0] || !request[0].rescheduledDate || !request[0].rescheduledTime) {
      return undefined;
    }

    const result = await db.update(visitRequests)
      .set({ 
        status: "approved",
        confirmedDate: request[0].rescheduledDate,
        confirmedTime: request[0].rescheduledTime,
        updatedAt: new Date()
      })
      .where(eq(visitRequests.id, id))
      .returning();
    
    return result[0];
  }

  async completeVisitRequest(id: number): Promise<VisitRequest | undefined> {
    const result = await db.update(visitRequests)
      .set({ 
        status: "completed",
        updatedAt: new Date()
      })
      .where(eq(visitRequests.id, id))
      .returning();
    
    return result[0];
  }

  async cancelVisitRequest(id: number): Promise<VisitRequest | undefined> {
    const result = await db.update(visitRequests)
      .set({ 
        status: "cancelled",
        updatedAt: new Date()
      })
      .where(eq(visitRequests.id, id))
      .returning();
    
    return result[0];
  }

  // Onboarding Request Methods
  async createOnboardingRequest(data: InsertOnboardingRequest): Promise<OnboardingRequest> {
    const result = await db.insert(onboardingRequests).values(data).returning();
    return result[0];
  }

  async getOnboardingRequestsByOwner(ownerId: number, pgId?: number): Promise<OnboardingRequest[]> {
    const conditions = [eq(onboardingRequests.ownerId, ownerId)];
    if (pgId) {
      conditions.push(eq(onboardingRequests.pgId, pgId));
    }

    const results = await db.select({
      onboardingRequest: onboardingRequests,
      pgName: pgMaster.pgName,
      roomNumber: rooms.roomNumber,
    })
      .from(onboardingRequests)
      .leftJoin(pgMaster, eq(onboardingRequests.pgId, pgMaster.id))
      .leftJoin(rooms, eq(onboardingRequests.roomId, rooms.id))
      .where(and(...conditions))
      .orderBy(desc(onboardingRequests.createdAt));

    return results.map(row => ({
      ...row.onboardingRequest,
      pgName: row.pgName || undefined,
      roomNumber: row.roomNumber || undefined,
    }));
  }

  async getOnboardingRequest(id: number): Promise<OnboardingRequest | undefined> {
    const result = await db.select()
      .from(onboardingRequests)
      .where(eq(onboardingRequests.id, id))
      .limit(1);
    return result[0];
  }

  async getOnboardingRequestByTenant(tenantUserId: number, pgId: number): Promise<OnboardingRequest | undefined> {
    const result = await db.select()
      .from(onboardingRequests)
      .where(
        and(
          eq(onboardingRequests.tenantUserId, tenantUserId),
          eq(onboardingRequests.pgId, pgId)
        )
      )
      .orderBy(desc(onboardingRequests.createdAt))
      .limit(1);
    
    return result[0];
  }

  async approveOnboardingRequest(id: number): Promise<OnboardingRequest | undefined> {
    return await db.transaction(async (tx) => {
      const request = await tx.select()
        .from(onboardingRequests)
        .where(eq(onboardingRequests.id, id))
        .limit(1);

      if (!request[0]) {
        throw new Error("Onboarding request not found");
      }

      const onboardingReq = request[0];

      const room = await tx.select()
        .from(rooms)
        .where(eq(rooms.id, onboardingReq.roomId))
        .limit(1);

      if (!room[0]) {
        throw new Error("Room not found");
      }

      // EXPLICIT CAPACITY CHECK - prevent partial commits if room is full
      const currentTenantIds = Array.isArray(room[0].tenantIds) ? room[0].tenantIds : [];
      const roomSharing = room[0].sharing || 1;
      if (currentTenantIds.length >= roomSharing) {
        throw new Error(`Room ${room[0].roomNumber} is fully occupied (${currentTenantIds.length}/${roomSharing} tenants). Cannot onboard new tenant.`);
      }

      const newTenant = await tx.insert(tenants).values({
        ownerId: onboardingReq.ownerId,
        pgId: onboardingReq.pgId,
        roomId: onboardingReq.roomId,
        userId: onboardingReq.tenantUserId,
        name: onboardingReq.name,
        email: onboardingReq.email,
        phone: onboardingReq.phone,
        roomNumber: room[0].roomNumber,
        monthlyRent: onboardingReq.monthlyRent,
        tenantImage: onboardingReq.tenantImage,
        aadharCard: onboardingReq.aadharCard,
        emergencyContactName: onboardingReq.emergencyContactName,
        emergencyContactPhone: onboardingReq.emergencyContactPhone,
        relationship: onboardingReq.emergencyContactRelationship,
        status: "active",
        onboardingStatus: "onboarded"
      }).returning();

      const updatedTenantIds = [...currentTenantIds, newTenant[0].id];
      
      let newStatus = "vacant";
      if (updatedTenantIds.length >= roomSharing) {
        newStatus = "occupied";
      } else if (updatedTenantIds.length > 0) {
        newStatus = "partially_occupied";
      }

      await tx.update(rooms)
        .set({ 
          tenantIds: updatedTenantIds,
          status: newStatus
        })
        .where(eq(rooms.id, onboardingReq.roomId));

      await tx.update(users)
        .set({ userType: "tenant" })
        .where(eq(users.id, onboardingReq.tenantUserId));

      const updatedRequest = await tx.update(onboardingRequests)
        .set({ 
          status: "approved",
          approvedAt: new Date()
        })
        .where(eq(onboardingRequests.id, id))
        .returning();

      return updatedRequest[0];
    });
  }

  async rejectOnboardingRequest(id: number, reason: string): Promise<OnboardingRequest | undefined> {
    const result = await db.update(onboardingRequests)
      .set({ 
        status: "rejected",
        rejectionReason: reason
      })
      .where(eq(onboardingRequests.id, id))
      .returning();
    
    return result[0];
  }

  // Tenant History Methods
  async createTenantHistory(data: InsertTenantHistory): Promise<TenantHistory> {
    const result = await db.insert(tenantHistory).values(data).returning();
    return result[0];
  }

  async getTenantHistory(tenantUserId: number): Promise<any[]> {
    const results = await db.select({
      history: tenantHistory,
      pgName: pgMaster.pgName,
      pgAddress: pgMaster.pgAddress,
      ownerName: users.name
    })
      .from(tenantHistory)
      .leftJoin(pgMaster, eq(tenantHistory.pgId, pgMaster.id))
      .leftJoin(users, eq(tenantHistory.recordedByOwnerId, users.id))
      .where(eq(tenantHistory.tenantUserId, tenantUserId))
      .orderBy(desc(tenantHistory.moveOutDate));

    return results.map(r => ({
      ...r.history,
      pgName: r.pgName,
      pgAddress: r.pgAddress,
      ownerName: r.ownerName
    }));
  }

  async getBatchTenantHistory(tenantUserIds: number[]): Promise<Map<number, any[]>> {
    if (tenantUserIds.length === 0) {
      return new Map();
    }

    const results = await db.select({
      history: tenantHistory,
      pgName: pgMaster.pgName,
      pgAddress: pgMaster.pgAddress,
      ownerName: users.name
    })
      .from(tenantHistory)
      .leftJoin(pgMaster, eq(tenantHistory.pgId, pgMaster.id))
      .leftJoin(users, eq(tenantHistory.recordedByOwnerId, users.id))
      .where(inArray(tenantHistory.tenantUserId, tenantUserIds))
      .orderBy(desc(tenantHistory.moveOutDate));

    // Group results by tenantUserId
    const historyMap = new Map<number, any[]>();
    
    results.forEach(r => {
      const userId = r.history.tenantUserId;
      if (!historyMap.has(userId)) {
        historyMap.set(userId, []);
      }
      historyMap.get(userId)!.push({
        ...r.history,
        pgName: r.pgName,
        pgAddress: r.pgAddress,
        ownerName: r.ownerName
      });
    });

    return historyMap;
  }

  async updateTenantHistory(id: number, updates: Partial<TenantHistory>): Promise<TenantHistory | undefined> {
    const result = await db.update(tenantHistory)
      .set(updates)
      .where(eq(tenantHistory.id, id))
      .returning();
    return result[0];
  }

  // Helper Methods
  async checkTenantOnboardingStatus(userId: number): Promise<number | null> {
    const tenant = await db.select()
      .from(tenants)
      .where(
        and(
          eq(tenants.userId, userId),
          eq(tenants.onboardingStatus, "onboarded"),
          eq(tenants.status, "active")
        )
      )
      .limit(1);

    if (tenant.length > 0 && tenant[0].pgId) {
      return tenant[0].pgId;
    }

    return null;
  }

  async getAvailableRoomsByPg(pgId: number): Promise<Room[]> {
    const allRooms = await db.select()
      .from(rooms)
      .where(eq(rooms.pgId, pgId))
      .orderBy(desc(rooms.createdAt));

    const availableRooms = allRooms.filter(room => {
      const currentTenantCount = Array.isArray(room.tenantIds) ? room.tenantIds.length : 0;
      const roomSharing = room.sharing || 1;
      return currentTenantCount < roomSharing;
    });

    return availableRooms;
  }

  // Electricity Billing Methods
  async createElectricityBillingCycle(data: InsertElectricityBillingCycle): Promise<ElectricityBillingCycle> {
    const result = await db.insert(electricityBillingCycles).values(data).returning();
    return result[0];
  }

  async getElectricityBillingCycle(id: number): Promise<ElectricityBillingCycle | undefined> {
    const result = await db.select().from(electricityBillingCycles).where(eq(electricityBillingCycles.id, id)).limit(1);
    return result[0];
  }

  async getElectricityBillingCycles(ownerId: number, pgId?: number): Promise<any[]> {
    let query = db.select()
      .from(electricityBillingCycles)
      .where(eq(electricityBillingCycles.ownerId, ownerId))
      .orderBy(desc(electricityBillingCycles.createdAt));

    if (pgId) {
      query = db.select()
        .from(electricityBillingCycles)
        .where(
          and(
            eq(electricityBillingCycles.ownerId, ownerId),
            eq(electricityBillingCycles.pgId, pgId)
          )
        )
        .orderBy(desc(electricityBillingCycles.createdAt));
    }

    return await query;
  }

  async updateElectricityBillingCycle(id: number, updates: Partial<ElectricityBillingCycle>): Promise<ElectricityBillingCycle | undefined> {
    const result = await db.update(electricityBillingCycles)
      .set(updates)
      .where(eq(electricityBillingCycles.id, id))
      .returning();
    return result[0];
  }

  async createElectricityRoomBill(data: InsertElectricityRoomBill): Promise<ElectricityRoomBill> {
    const result = await db.insert(electricityRoomBills).values(data).returning();
    return result[0];
  }

  async getElectricityRoomBills(cycleId: number): Promise<any[]> {
    const roomBills = await db.select({
      id: electricityRoomBills.id,
      cycleId: electricityRoomBills.cycleId,
      roomId: electricityRoomBills.roomId,
      pgId: electricityRoomBills.pgId,
      meterNumber: electricityRoomBills.meterNumber,
      previousReading: electricityRoomBills.previousReading,
      currentReading: electricityRoomBills.currentReading,
      unitsConsumed: electricityRoomBills.unitsConsumed,
      roomAmount: electricityRoomBills.roomAmount,
      ratePerUnit: electricityRoomBills.ratePerUnit,
      notes: electricityRoomBills.notes,
      createdAt: electricityRoomBills.createdAt,
      roomNumber: rooms.roomNumber,
      sharing: rooms.sharing,
      tenantIds: rooms.tenantIds,
    })
      .from(electricityRoomBills)
      .leftJoin(rooms, eq(electricityRoomBills.roomId, rooms.id))
      .where(eq(electricityRoomBills.cycleId, cycleId));

    return roomBills;
  }

  async updateElectricityRoomBill(id: number, updates: Partial<ElectricityRoomBill>): Promise<ElectricityRoomBill | undefined> {
    const result = await db.update(electricityRoomBills)
      .set(updates)
      .where(eq(electricityRoomBills.id, id))
      .returning();
    return result[0];
  }

  async getElectricityCycleSummary(cycleId: number): Promise<any> {
    const cycle = await this.getElectricityBillingCycle(cycleId);
    if (!cycle) {
      return null;
    }

    const roomBills = await this.getElectricityRoomBills(cycleId);

    const tenantCharges = await db.select({
      id: electricityTenantCharges.id,
      roomBillId: electricityTenantCharges.roomBillId,
      tenantId: electricityTenantCharges.tenantId,
      shareAmount: electricityTenantCharges.shareAmount,
      dueDate: electricityTenantCharges.dueDate,
      paymentId: electricityTenantCharges.paymentId,
      tenantName: tenants.name,
      roomNumber: tenants.roomNumber,
    })
      .from(electricityTenantCharges)
      .leftJoin(tenants, eq(electricityTenantCharges.tenantId, tenants.id))
      .where(eq(electricityTenantCharges.cycleId, cycleId));

    return {
      cycle,
      roomBills,
      tenantCharges,
      totalAmount: roomBills.reduce((sum, bill) => sum + Number(bill.roomAmount || 0), 0),
      totalUnits: roomBills.reduce((sum, bill) => sum + Number(bill.unitsConsumed || 0), 0),
      totalRooms: roomBills.length,
      totalTenants: tenantCharges.length,
    };
  }

  async confirmElectricityBillingCycle(cycleId: number, ownerId: number, dueDate?: Date): Promise<{ cycle: ElectricityBillingCycle, paymentsCreated: number, notificationsCreated: number }> {
    return await db.transaction(async (tx) => {
      const roomBills = await this.getElectricityRoomBills(cycleId);
      const cycle = await this.getElectricityBillingCycle(cycleId);

      if (!cycle) {
        throw new Error('Billing cycle not found');
      }

      if (cycle.status !== 'draft') {
        throw new Error('Only draft cycles can be confirmed');
      }

      let paymentsCreated = 0;
      let notificationsCreated = 0;

      const paymentDueDate = dueDate || new Date(new Date().setDate(new Date().getDate() + 7));

      for (const roomBill of roomBills) {
        const tenantIds = Array.isArray(roomBill.tenantIds) ? roomBill.tenantIds : [];
        
        if (tenantIds.length === 0) {
          continue;
        }

        const tenantsList = await tx.select()
          .from(tenants)
          .where(
            and(
              inArray(tenants.id, tenantIds),
              eq(tenants.status, 'active')
            )
          );

        const activeTenantCount = tenantsList.length;
        if (activeTenantCount === 0) {
          continue;
        }

        const roomAmount = Number(roomBill.roomAmount || 0);
        const sharePerTenant = roomAmount / activeTenantCount;
        const roundedShare = Math.round(sharePerTenant * 100) / 100;

        let remainder = roomAmount - (roundedShare * activeTenantCount);
        remainder = Math.round(remainder * 100) / 100;

        for (let i = 0; i < tenantsList.length; i++) {
          const tenant = tenantsList[i];
          let shareAmount = roundedShare;

          if (i === tenantsList.length - 1 && remainder !== 0) {
            shareAmount = roundedShare + remainder;
          }

          const tenantCharge = await tx.insert(electricityTenantCharges).values({
            roomBillId: roomBill.id,
            cycleId: cycleId,
            tenantId: tenant.id,
            ownerId: ownerId,
            pgId: roomBill.pgId!,
            shareAmount: shareAmount.toString(),
            dueDate: paymentDueDate,
          }).returning();

          const payment = await tx.insert(payments).values({
            tenantId: tenant.id,
            ownerId: ownerId,
            pgId: roomBill.pgId!,
            amount: shareAmount.toString(),
            type: 'electricity',
            status: 'pending',
            paymentMonth: cycle.billingMonth,
            generatedAt: new Date(),
            dueDate: paymentDueDate,
          }).returning();

          await tx.update(electricityTenantCharges)
            .set({ paymentId: payment[0].id })
            .where(eq(electricityTenantCharges.id, tenantCharge[0].id));

          paymentsCreated++;

          if (tenant.userId) {
            await tx.insert(notifications).values({
              userId: tenant.userId,
              title: 'New Electricity Bill',
              message: `Electricity bill for ${cycle.billingMonth} has been generated. Amount: ₹${shareAmount}. Due date: ${paymentDueDate.toLocaleDateString()}`,
              type: 'rent_reminder',
            });
            notificationsCreated++;
          }
        }
      }

      const updatedCycle = await tx.update(electricityBillingCycles)
        .set({
          status: 'confirmed',
          confirmedAt: new Date(),
        })
        .where(eq(electricityBillingCycles.id, cycleId))
        .returning();

      return {
        cycle: updatedCycle[0],
        paymentsCreated,
        notificationsCreated,
      };
    });
  }
}

export const storage = new DatabaseStorage();
