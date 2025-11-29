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
  users,
  otpCodes,
  tenants,
  payments,
  notifications,
  rooms
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte } from "drizzle-orm";
import bcrypt from "bcrypt";

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
  getTenants(ownerId: number): Promise<Tenant[]>;
  getTenant(id: number): Promise<Tenant | undefined>;
  getAvailableTenants(ownerId: number): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: number, updates: Partial<Tenant>): Promise<Tenant | undefined>;
  deleteTenant(id: number): Promise<void>;
  
  // Payments
  getPayments(ownerId: number): Promise<Payment[]>;
  getPaymentsByTenant(tenantId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined>;
  
  // Notifications
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;

  // Rooms
  getRooms(ownerId: number): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<void>;
  getRoomWithTenant(roomId: number): Promise<any>;
  getAllRoomsWithTenants(ownerId: number): Promise<any[]>;
  seedInitialRooms(ownerId: number): Promise<void>;
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
  async getTenants(ownerId: number): Promise<Tenant[]> {
    return await db.select().from(tenants).where(eq(tenants.ownerId, ownerId)).orderBy(desc(tenants.createdAt));
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return result[0];
  }

  async getAvailableTenants(ownerId: number): Promise<Tenant[]> {
    // Get all tenants for this owner that are not currently assigned to any room
    const allRooms = await db.select({ tenantIds: rooms.tenantIds }).from(rooms).where(eq(rooms.ownerId, ownerId));
    const assignedIds: number[] = [];
    allRooms.forEach(room => {
      if (room.tenantIds && Array.isArray(room.tenantIds)) {
        assignedIds.push(...room.tenantIds);
      }
    });
    
    const result = await db.select().from(tenants)
      .where(eq(tenants.ownerId, ownerId))
      .orderBy(desc(tenants.createdAt));
    
    return result.filter(t => !assignedIds.includes(t.id));
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const result = await db.insert(tenants).values(tenant).returning();
    return result[0];
  }

  async updateTenant(id: number, updates: Partial<Tenant>): Promise<Tenant | undefined> {
    const result = await db.update(tenants).set(updates).where(eq(tenants.id, id)).returning();
    return result[0];
  }

  async deleteTenant(id: number): Promise<void> {
    await db.delete(tenants).where(eq(tenants.id, id));
  }

  // Payments
  async getPayments(ownerId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.ownerId, ownerId)).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByTenant(tenantId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.tenantId, tenantId)).orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(payment).returning();
    return result[0];
  }

  async updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined> {
    const result = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return result[0];
  }

  // Notifications
  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  // Rooms
  async getRooms(ownerId: number): Promise<Room[]> {
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
    const result = await db
      .select({
        room: rooms,
        tenant: tenants,
      })
      .from(rooms)
      .leftJoin(tenants, eq(rooms.tenantId, tenants.id))
      .where(eq(rooms.id, roomId))
      .limit(1);
    return result[0];
  }

  async getRoomByNumber(ownerId: number, roomNumber: string): Promise<Room | undefined> {
    const result = await db.select().from(rooms)
      .where(and(eq(rooms.ownerId, ownerId), eq(rooms.roomNumber, roomNumber)))
      .limit(1);
    return result[0];
  }

  async getAllRoomsWithTenants(ownerId: number): Promise<any[]> {
    try {
      const result = await db
        .select()
        .from(rooms)
        .where(eq(rooms.ownerId, ownerId))
        .orderBy(desc(rooms.createdAt));
      
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
          return { room, tenants };
        })
      );
      
      return roomsWithTenants;
    } catch (error) {
      console.error("Error fetching rooms with tenants:", error);
      return [];
    }
  }

  async seedInitialRooms(ownerId: number): Promise<void> {
    const seedData = [
      { roomNumber: "101", monthlyRent: "5000", sharing: 1, floor: 1, hasAttachedBathroom: true, hasAC: true, tenantNames: ["Rahul Kumar"], tenantPhones: ["98765 43210"], amenities: ["WiFi", "Water", "Power"] },
      { roomNumber: "102", monthlyRent: "6500", sharing: 2, floor: 1, hasAttachedBathroom: false, hasAC: false, tenantNames: ["Amit Singh", "Vikram Patel"], tenantPhones: ["98765 43211", "98765 43215"], amenities: ["WiFi", "Water", "Power"] },
      { roomNumber: "201", monthlyRent: "7000", sharing: 3, floor: 2, hasAttachedBathroom: false, hasAC: false, tenantNames: ["Priya Sharma", "Neha Desai"], tenantPhones: ["98765 43212", "98765 43216"], amenities: ["WiFi", "Water", "Power"] },
      { roomNumber: "202", monthlyRent: "5500", sharing: 2, floor: 2, hasAttachedBathroom: true, hasAC: false, tenantNames: [], tenantPhones: [], amenities: ["WiFi", "Water", "Power"] },
      { roomNumber: "301", monthlyRent: "8000", sharing: 1, floor: 3, hasAttachedBathroom: true, hasAC: true, tenantNames: ["Sneha Gupta"], tenantPhones: ["98765 43213"], amenities: ["WiFi", "Water", "Power"] },
      { roomNumber: "302", monthlyRent: "8000", sharing: 3, floor: 3, hasAttachedBathroom: false, hasAC: false, tenantNames: [], tenantPhones: [], amenities: ["WiFi", "Water", "Power"] },
    ];

    for (const data of seedData) {
      const tenantIds: number[] = [];

      // Create tenants if room has any
      for (let i = 0; i < data.tenantNames.length; i++) {
        const createdTenant = await this.createTenant({
          ownerId,
          name: data.tenantNames[i],
          phone: data.tenantPhones[i],
          roomNumber: data.roomNumber,
          monthlyRent: data.monthlyRent,
        });
        tenantIds.push(createdTenant.id);
      }

      // Create room with tenant IDs (status is automatically set based on tenants)
      const status = tenantIds.length > 0 ? "occupied" : "vacant";
      await this.createRoom({
        ownerId,
        roomNumber: data.roomNumber,
        monthlyRent: data.monthlyRent,
        tenantIds: tenantIds.length > 0 ? tenantIds : [],
        sharing: data.sharing,
        floor: data.floor,
        hasAttachedBathroom: data.hasAttachedBathroom,
        hasAC: data.hasAC,
        status,
        amenities: data.amenities,
      });
    }
  }
}

export const storage = new DatabaseStorage();
