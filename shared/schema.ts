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
  userType: text("user_type").default("owner"), // owner, tenant, admin, applicant
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
  latitude: decimal("latitude", { precision: 10, scale: 7 }), // Latitude for location-based search
  longitude: decimal("longitude", { precision: 10, scale: 7 }), // Longitude for location-based search
  imageUrl: text("image_url"), // PG image (base64 or URL)
  totalRooms: integer("total_rooms").default(0),
  rentPaymentDate: integer("rent_payment_date"), // Day of month (1-31) when rent is due
  status: text("status").default("pending"), // pending, approved, rejected - Admin approval status
  approvedBy: integer("approved_by").references(() => users.id), // Admin who approved
  approvedAt: timestamp("approved_at"), // When it was approved
  rejectionReason: text("rejection_reason"), // Reason for rejection if status is rejected
  isActive: boolean("is_active").default(true), // Can be deactivated by admin for non-payment
  subscriptionStatus: text("subscription_status").default("trial"), // trial, active, expired, suspended
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  
  // Amenities and filters for tenant search
  pgType: text("pg_type").default("common"), // male, female, common
  hasFood: boolean("has_food").default(false),
  hasParking: boolean("has_parking").default(false),
  hasAC: boolean("has_ac").default(false),
  hasCCTV: boolean("has_cctv").default(false),
  hasWifi: boolean("has_wifi").default(false),
  hasLaundry: boolean("has_laundry").default(false),
  hasGym: boolean("has_gym").default(false),
  
  // Rating aggregates (updated when ratings are added)
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  totalRatings: integer("total_ratings").default(0),
  
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
  roomId: integer("room_id").references(() => rooms.id), // Direct room assignment
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
  onboardingStatus: text("onboarding_status").default("not_onboarded"), // not_onboarded, pending, onboarded
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
  status: text("status").default("pending"), // pending, pending_approval, paid, overdue
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

// Subscription Plans table (configured by admin)
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Starter, Pro, Enterprise
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }),
  maxRooms: integer("max_rooms"), // null for unlimited
  maxTenants: integer("max_tenants"), // null for unlimited
  features: text("features").array().default([]), // Array of feature descriptions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// PG Subscriptions table (tracks subscription payments for each PG)
export const pgSubscriptions = pgTable("pg_subscriptions", {
  id: serial("id").primaryKey(),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  billingCycle: text("billing_cycle").notNull(), // monthly, yearly
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, paid, overdue, cancelled
  paymentMethod: text("payment_method"), // upi, bank_transfer, card, other
  transactionId: text("transaction_id"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  paidAt: timestamp("paid_at"),
  invoiceUrl: text("invoice_url"), // Link to invoice PDF
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPgSubscriptionSchema = createInsertSchema(pgSubscriptions).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPgSubscription = z.infer<typeof insertPgSubscriptionSchema>;
export type PgSubscription = typeof pgSubscriptions.$inferSelect;

// PG Ratings table (tenant reviews of PGs)
export const pgRatings = pgTable("pg_ratings", {
  id: serial("id").primaryKey(),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  tenantUserId: integer("tenant_user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  cleanliness: integer("cleanliness"), // 1-5
  safety: integer("safety"), // 1-5
  facilities: integer("facilities"), // 1-5
  valueForMoney: integer("value_for_money"), // 1-5
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPgRatingSchema = createInsertSchema(pgRatings).omit({ 
  id: true, 
  createdAt: true 
});
export type InsertPgRating = z.infer<typeof insertPgRatingSchema>;
export type PgRating = typeof pgRatings.$inferSelect;

// Visit Requests table (tenant requests to visit PG)
export const visitRequests = pgTable("visit_requests", {
  id: serial("id").primaryKey(),
  tenantUserId: integer("tenant_user_id").notNull().references(() => users.id),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  roomId: integer("room_id").references(() => rooms.id), // Optional: specific room interest
  ownerId: integer("owner_id").notNull().references(() => users.id),
  
  // Visit scheduling
  requestedDate: timestamp("requested_date").notNull(),
  requestedTime: text("requested_time").notNull(), // e.g., "10:00 AM"
  status: text("status").default("pending"), // pending, approved, rescheduled, completed, cancelled
  
  // Rescheduling by owner
  rescheduledDate: timestamp("rescheduled_date"),
  rescheduledTime: text("rescheduled_time"),
  rescheduledBy: text("rescheduled_by"), // owner or tenant
  
  // Confirmation
  confirmedDate: timestamp("confirmed_date"), // Final confirmed date after any rescheduling
  confirmedTime: text("confirmed_time"),
  
  notes: text("notes"), // Additional notes from tenant
  ownerNotes: text("owner_notes"), // Notes from owner
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVisitRequestSchema = createInsertSchema(visitRequests).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});
export type InsertVisitRequest = z.infer<typeof insertVisitRequestSchema>;
export type VisitRequest = typeof visitRequests.$inferSelect;

// Onboarding Requests table (tenant requests to join PG after visit)
export const onboardingRequests = pgTable("onboarding_requests", {
  id: serial("id").primaryKey(),
  tenantUserId: integer("tenant_user_id").notNull().references(() => users.id),
  visitRequestId: integer("visit_request_id").references(() => visitRequests.id),
  pgId: integer("pg_id").notNull().references(() => pgMaster.id, { onDelete: "cascade" }),
  roomId: integer("room_id").notNull().references(() => rooms.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  
  // Tenant details for onboarding
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  
  // Documents (base64 encoded)
  tenantImage: text("tenant_image"),
  aadharCard: text("aadhar_card"),
  
  // Emergency contacts
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelationship: text("emergency_contact_relationship"),
  
  status: text("status").default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const insertOnboardingRequestSchema = createInsertSchema(onboardingRequests).omit({ 
  id: true, 
  createdAt: true,
  approvedAt: true
});
export type InsertOnboardingRequest = z.infer<typeof insertOnboardingRequestSchema>;
export type OnboardingRequest = typeof onboardingRequests.$inferSelect;
