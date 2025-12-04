import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users/Owners table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  mobile: text("mobile").notNull(),
  password: text("password"), // nullable for OAuth users
  userType: text("user_type").default("owner"), // owner, tenant, admin
  pgAddress: text("pg_address"),
  pgLocation: text("pg_location"),
  isVerified: boolean("is_verified").default(false),
  requiresPasswordReset: boolean("requires_password_reset").default(false), // For first-time login after invitation
  googleId: text("google_id"),
  subscriptionTier: text("subscription_tier").default("none"), // none, starter, pro, enterprise
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  upiId: text("upi_id"), // UPI ID for receiving payments
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true,
  isVerified: true
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// OTP verification codes
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOtpSchema = createInsertSchema(otpCodes).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;

// PG Master table (defined before tenants and rooms to satisfy foreign key references)
export const pgMaster = pgTable("pg_master", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  pgName: text("pg_name").notNull(),
  pgAddress: text("pg_address").notNull(),
  pgLocation: text("pg_location").notNull(),
  totalRooms: integer("total_rooms").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPgMasterSchema = createInsertSchema(pgMaster).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPgMaster = z.infer<typeof insertPgMasterSchema>;
export type PgMaster = typeof pgMaster.$inferSelect;

// Tenants table
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  pgId: integer("pg_id").references(() => pgMaster.id),
  userId: integer("user_id").references(() => users.id), // Link to tenant user account
  name: text("name").notNull(),
  email: text("email").default(""), // Email of tenant (when added by owner)
  phone: text("phone").notNull(),
  roomNumber: text("room_number").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  tenantImage: text("tenant_image"), // Base64 encoded image
  aadharCard: text("aadhar_card"), // Base64 encoded Aadhar/ID document
  photoUrl: text("photo_url"),
  idProofUrl: text("id_proof_url"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  relationship: text("relationship"), // Father, Mother, Brother, Sister, Spouse, Other
  status: text("status").default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;

// Emergency Contacts table (one-to-many relationship with tenants)
export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  relationship: text("relationship").notNull(), // Father, Mother, Brother, Sister, Spouse, Other
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;
export type EmergencyContact = typeof emergencyContacts.$inferSelect;

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  pgId: integer("pg_id").references(() => pgMaster.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // rent, maintenance, other
  status: text("status").default("pending"), // pending, paid, overdue
  paymentMethod: text("payment_method"), // upi, cash, bank_transfer, other
  transactionId: text("transaction_id"), // UPI transaction ID or reference number
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // rent_reminder, complaint, system, message
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  createdAt: true,
  isRead: true
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Rooms table
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  pgId: integer("pg_id").references(() => pgMaster.id),
  roomNumber: text("room_number").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  tenantIds: integer("tenant_ids").array().default([]), // Array of tenant IDs
  sharing: integer("sharing").default(1), // 1-6 for number of people sharing
  floor: integer("floor").default(1), // Floor number
  hasAttachedBathroom: boolean("has_attached_bathroom").default(false), // true for attached, false for common
  hasAC: boolean("has_ac").default(false), // true if AC, false if no AC
  status: text("status").default("vacant"), // occupied, vacant
  amenities: text("amenities").array().default([]), // WiFi, Water, Power
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

// Complaints table
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  tenantId: integer("tenant_id").references(() => tenants.id),
  roomId: integer("room_id").references(() => rooms.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("medium"), // low, medium, high
  status: text("status").default("open"), // open, in-progress, resolved
  resolutionNotes: text("resolution_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({ 
  id: true, 
  createdAt: true,
  resolvedAt: true
});
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaints.$inferSelect;
