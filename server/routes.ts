import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTenantSchema, insertPaymentSchema, insertNotificationSchema, insertRoomSchema, insertEmergencyContactSchema, insertComplaintSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import Papa from "papaparse";
import { sendOtpEmail } from "./email";

// Configure multer for file upload (memory storage for CSV processing)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Schema for bulk room upload row
const bulkRoomRowSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  floor: z.coerce.number().int().min(0).default(1),
  sharing: z.coerce.number().int().min(1).max(10).default(1),
  monthlyRent: z.coerce.number().positive("Monthly rent must be positive"),
  status: z.preprocess(
    (val) => typeof val === 'string' && val.trim() !== '' ? val.trim().toLowerCase() : undefined,
    z.enum(['vacant', 'partially_occupied', 'fully_occupied']).optional()
  ),
  hasAttachedBathroom: z.preprocess(
    (val) => val === 'true' || val === 'yes' || val === '1' || val === true,
    z.boolean().default(false)
  ),
  hasAC: z.preprocess(
    (val) => val === 'true' || val === 'yes' || val === '1' || val === true,
    z.boolean().default(false)
  ),
  amenities: z.preprocess(
    (val) => typeof val === 'string' ? val.split(';').map(s => s.trim()).filter(Boolean) : [],
    z.array(z.string()).default([])
  ),
  tenantIdentifiers: z.preprocess(
    (val) => typeof val === 'string' ? val.split(';').map(s => s.trim()).filter(Boolean) : [],
    z.array(z.string()).default([])
  ),
});

declare global {
  namespace Express {
    interface Session {
      userId?: number;
      registrationData?: any;
      selectedPgId?: number;
    }
    interface SessionData {
      userId?: number;
      registrationData?: any;
      selectedPgId?: number;
    }
  }
}

// Validation schemas
const registrationSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(10),
  userType: z.enum(["owner", "tenant", "admin"]).default("owner"),
  password: z.string().min(8),
  pgAddress: z.string().optional(),
  pgLocation: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  imageUrl: z.string().optional(),
});

const otpVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().optional().default(false),
});

const createTenantSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  roomNumber: z.string(),
  monthlyRent: z.string().or(z.number()),
  tenantImage: z.string().optional(),
  aadharCard: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  relationship: z.string().optional(),
});

const createVisitRequestSchema = z.object({
  pgId: z.number().int().positive(),
  roomId: z.number().int().positive().optional(),
  requestedDate: z.string(),
  requestedTime: z.string(),
  notes: z.string().optional(),
});

const rescheduleVisitSchema = z.object({
  newDate: z.string(),
  newTime: z.string(),
  ownerNotes: z.string().optional(),
});

const createOnboardingRequestSchema = z.object({
  visitRequestId: z.number().int().positive().optional(),
  pgId: z.number().int().positive(),
  roomId: z.number().int().positive(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  monthlyRent: z.number().positive(),
  tenantImage: z.string().optional(),
  aadharCard: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
});

const rejectOnboardingSchema = z.object({
  reason: z.string().min(1),
});

// Helper function to generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to generate default password
function generateDefaultPassword(): string {
  return Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 1000);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // MIDDLEWARE: Check if owner's PG is approved and active
  const requireApprovedPg = async (req: any, res: any, next: any) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user || user.userType !== "owner") {
      return next();
    }

    const selectedPgId = req.session.selectedPgId;
    let pg;
    
    if (selectedPgId) {
      pg = await storage.getPgById(selectedPgId);
    } else {
      pg = await storage.getPgByOwnerId(userId);
    }

    if (!pg) {
      return res.status(400).json({ error: "No PG found. Please create a PG first." });
    }

    if (pg.status === "pending") {
      return res.status(403).json({ 
        error: "Your PG is pending admin approval. You cannot use the system until your PG is approved.",
        status: "pending"
      });
    }

    if (pg.status === "rejected") {
      return res.status(403).json({ 
        error: `Your PG has been rejected. Reason: ${pg.rejectionReason || "No reason provided"}`,
        status: "rejected",
        reason: pg.rejectionReason
      });
    }

    if (!pg.isActive) {
      return res.status(403).json({ 
        error: "Your PG has been deactivated by the admin. Please contact support.",
        status: "deactivated"
      });
    }

    next();
  };

  // MIDDLEWARE: Admin-only access
  const adminOnly = async (req: any, res: any, next: any) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user || user.userType !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = user;
    next();
  };

  // AUTH ROUTES
  app.post("/api/auth/register", async (req, res) => {
    try {
      const body = registrationSchema.parse(req.body);

      // Check if user exists
      const existingUser = await storage.getUserByEmail(body.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Prevent multiple admin users
      if (body.userType === "admin") {
        const adminExists = await storage.adminExists();
        if (adminExists) {
          return res.status(403).json({ error: "Admin user already exists. Only one admin is allowed in the system." });
        }
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP (in real app, send via SMS/Email)
      await storage.createOtp({
        email: body.email,
        mobile: body.mobile,
        code: otp,
        expiresAt,
      });

      // Store registration data in session for later use
      req.session!.registrationData = body;

      // Send OTP via email
      await sendOtpEmail(body.email, otp, "registration");

      res.json({ 
        success: true, 
        message: "OTP sent to your email"
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const body = otpVerificationSchema.parse(req.body);
      const registrationData = req.session!.registrationData;

      if (!registrationData) {
        return res.status(400).json({ error: "Registration session expired" });
      }

      // Verify OTP
      const validOtp = await storage.getValidOtp(body.email, body.code);
      if (!validOtp) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Create user
      const user = await storage.createUser({
        ...registrationData,
        isVerified: true,
      });

      // Create PG record for owner users
      if (registrationData.userType === "owner" && (registrationData.pgAddress || registrationData.pgLocation)) {
        await storage.createPgMaster({
          ownerId: user.id,
          pgName: registrationData.pgAddress || "My PG",
          pgAddress: registrationData.pgAddress || "",
          pgLocation: registrationData.pgLocation || "",
          latitude: registrationData.latitude || null,
          longitude: registrationData.longitude || null,
          imageUrl: registrationData.imageUrl || null,
          totalRooms: 0,
        });
      }

      // Delete used OTP
      await storage.deleteOtp(validOtp.id);
      delete req.session!.registrationData;

      // Set session
      req.session!.userId = user.id;

      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(400).json({ error: "Invalid OTP" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const body = loginSchema.parse(req.body);

      // Check if user exists
      const existingUser = await storage.getUserByEmail(body.email);
      if (!existingUser) {
        return res.status(401).json({ error: "User not found. Please register first." });
      }

      // Verify password
      const user = await storage.verifyPassword(body.email, body.password);
      if (!user) {
        return res.status(401).json({ error: "Invalid password. Please try again." });
      }

      if (!user.isVerified) {
        return res.status(401).json({ error: "Email not verified. Please verify your email to login." });
      }

      // Handle Remember Me - extend session to 30 days if checked
      if (body.rememberMe) {
        req.session!.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session!.cookie.maxAge = 24 * 60 * 60 * 1000; // 24 hours (default)
      }

      // Check if user needs password reset (for newly invited tenants)
      if (user.requiresPasswordReset) {
        req.session!.userId = user.id;
        return res.json({ 
          success: true, 
          user: { id: user.id, email: user.email, name: user.name },
          requiresPasswordReset: true,
          redirectUrl: "/tenant-reset-password"
        });
      }

      // Set user session first
      req.session!.userId = user.id;

      // Check PG approval status for owners
      if (user.userType === "owner") {
        const allPgs = await storage.getAllPgsByOwnerId(user.id);
        
        // If owner has PGs, check if at least one is approved and active
        if (allPgs.length > 0) {
          const approvedPg = allPgs.find(pg => pg.status === "approved" && pg.isActive);
          
          if (!approvedPg) {
            // No approved PGs - destroy session and check status to provide specific error
            req.session!.destroy(() => {});
            
            const hasPending = allPgs.some(pg => pg.status === "pending");
            const hasRejected = allPgs.some(pg => pg.status === "rejected");
            const hasDeactivated = allPgs.some(pg => !pg.isActive && pg.status === "approved");
            
            if (hasPending && !hasRejected && !hasDeactivated) {
              return res.status(403).json({ 
                error: "Your PG is pending admin approval. Please wait for confirmation before logging in.",
                status: "pending"
              });
            } else if (hasRejected) {
              const rejectedPg = allPgs.find(pg => pg.status === "rejected");
              return res.status(403).json({ 
                error: `Your PG has been rejected${rejectedPg?.rejectionReason ? `: ${rejectedPg.rejectionReason}` : ''}. Please contact support for more information.`,
                status: "rejected"
              });
            } else if (hasDeactivated) {
              return res.status(403).json({ 
                error: "Your PG has been deactivated. Please contact support to reactivate your account.",
                status: "deactivated"
              });
            }
          } else {
            // Set approved PG in session
            (req.session as any).selectedPgId = approvedPg.id;
          }
        }
        // If no PGs exist, allow login (new owner needs to create PG)
      }
      
      // Explicitly save session to ensure persistence
      req.session!.save((err: any) => {
        if (err) {
          console.error("Session save error during login:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        
        // Redirect based on user type
        let redirectUrl = "/dashboard";
        if (user.userType === "tenant") {
          redirectUrl = "/tenant-dashboard";
        } else if (user.userType === "admin") {
          redirectUrl = "/admin-dashboard";
        }
        
        res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, userType: user.userType }, redirectUrl });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid login data" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        userType: user.userType,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session!.destroy((err: any) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ success: true });
    });
  });

  // STEP 2: Password Reset (for newly invited tenants)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const resetSchema = z.object({
        newPassword: z.string().min(8),
        confirmPassword: z.string().min(8),
      });

      const body = resetSchema.parse(req.body);
      if (body.newPassword !== body.confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate OTP for verification
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createOtp({
        email: user.email,
        mobile: user.mobile,
        code: otp,
        expiresAt,
      });

      // Send OTP via email
      await sendOtpEmail(user.email, otp, "password_reset");

      res.json({
        success: true,
        message: "OTP sent to your email"
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(400).json({ error: "Failed to initiate password reset", details: (error as any).message });
    }
  });

  app.post("/api/auth/verify-password-reset", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const verifySchema = z.object({
        newPassword: z.string().min(8),
        otp: z.string().length(6),
      });

      const body = verifySchema.parse(req.body);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify OTP
      const validOtp = await storage.getValidOtp(user.email, body.otp);
      if (!validOtp) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Update password and clear requiresPasswordReset flag
      await storage.updateUser(userId, {
        password: body.newPassword, // Will be hashed by storage layer
        requiresPasswordReset: false,
      });

      // Delete used OTP
      await storage.deleteOtp(validOtp.id);

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset verification error:", error);
      res.status(400).json({ error: "Failed to reset password", details: (error as any).message });
    }
  });

  // FORGOT PASSWORD ROUTES
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found with this email" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save OTP to database with user's mobile number
      await storage.createOtp({ 
        email, 
        mobile: user.mobile || "N/A",
        code: otp, 
        expiresAt 
      });

      // Send OTP via email
      await sendOtpEmail(email, otp, "forgot_password");

      res.json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(400).json({ error: "Failed to process forgot password", details: (error as any).message });
    }
  });

  app.post("/api/auth/verify-forgot-password", async (req, res) => {
    try {
      const verifySchema = z.object({
        email: z.string().email(),
        otp: z.string().length(6),
        newPassword: z.string().min(8),
      });

      const body = verifySchema.parse(req.body);

      const user = await storage.getUserByEmail(body.email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify OTP
      const validOtp = await storage.getValidOtp(body.email, body.otp);
      if (!validOtp) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Update password
      await storage.updateUser(user.id, {
        password: body.newPassword, // Will be hashed by storage layer
      });

      // Delete used OTP
      await storage.deleteOtp(validOtp.id);

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Forgot password verification error:", error);
      res.status(400).json({ error: "Failed to reset password", details: (error as any).message });
    }
  });

  // TENANT DASHBOARD ROUTES
  app.get("/api/tenant/dashboard", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Get tenant record for this user
      const tenant = await storage.getTenantByUserId(userId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant record not found" });
      }

      // Get PG details
      let pgInfo = null;
      if (tenant.pgId) {
        const pg = await storage.getPgById(tenant.pgId);
        if (pg) {
          pgInfo = {
            id: pg.id,
            pgName: pg.pgName,
            pgAddress: pg.pgAddress,
            pgLocation: pg.pgLocation,
            hasFood: pg.hasFood,
            hasParking: pg.hasParking,
            hasAC: pg.hasAC,
            hasCCTV: pg.hasCCTV,
            hasWifi: pg.hasWifi,
            hasLaundry: pg.hasLaundry,
            hasGym: pg.hasGym,
          };
        }
      }

      // Get room details
      let roomDetails = null;
      if (tenant.roomId) {
        const room = await storage.getRoom(tenant.roomId);
        if (room) {
          roomDetails = {
            id: room.id,
            roomNumber: room.roomNumber,
            floor: room.floor,
            sharing: room.sharing,
            hasAttachedBathroom: room.hasAttachedBathroom,
            hasAC: room.hasAC,
            amenities: room.amenities,
          };
        }
      }

      // Get payment summary
      const payments = await storage.getPaymentsByTenant(tenant.id);
      const paymentSummary = {
        totalPaid: payments.filter(p => p.status === "paid").reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
        totalPending: payments.filter(p => p.status === "pending").reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
        totalOverdue: payments.filter(p => p.status === "overdue").reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
        recentPayments: payments.slice(0, 5),
      };

      res.json({
        name: tenant.name,
        roomNumber: tenant.roomNumber,
        monthlyRent: tenant.monthlyRent,
        pgInfo,
        roomDetails,
        paymentSummary,
      });
    } catch (error) {
      console.error("Tenant dashboard error:", error);
      res.status(400).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.get("/api/tenant/profile", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      res.json({
        name: user.name,
        email: user.email,
        phone: user.mobile,
        joinDate: user.createdAt,
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch profile" });
    }
  });

  app.get("/api/tenant/room", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const tenant = await storage.getTenantByUserId(userId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant record not found" });
      }

      const room = await storage.getRoomByNumber(tenant.ownerId, tenant.roomNumber, tenant.pgId || undefined);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch room details" });
    }
  });

  // Get room details by ID for tenant (tenant-safe - for onboarding)
  app.get("/api/tenant/rooms/:id", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const roomId = parseInt(req.params.id);
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Return tenant-safe room data (no sensitive owner info)
      res.json({
        id: room.id,
        roomNumber: room.roomNumber,
        monthlyRent: room.monthlyRent,
        sharing: room.sharing,
        floor: room.floor,
        hasAttachedBathroom: room.hasAttachedBathroom,
        hasAC: room.hasAC,
        amenities: room.amenities,
        status: room.status,
      });
    } catch (error) {
      console.error("Fetch room by ID error:", error);
      res.status(400).json({ error: "Failed to fetch room details" });
    }
  });

  app.get("/api/tenant/payments", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const tenant = await storage.getTenantByUserId(userId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant record not found" });
      }

      const payments = await storage.getPaymentsByTenant(tenant.id);
      res.json(payments);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/tenant/pg", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const tenant = await storage.getTenantByUserId(userId);
      if (!tenant || !tenant.pgId) {
        return res.status(404).json({ error: "PG not found" });
      }

      const pg = await storage.getPgById(tenant.pgId);
      res.json(pg || {});
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch PG details" });
    }
  });

  app.get("/api/tenant/facilities", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Return default facilities for now
      res.json([
        { name: "WiFi", available: true },
        { name: "Water Supply", available: true },
        { name: "Electricity", available: true },
        { name: "Kitchen", available: true },
      ]);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch facilities" });
    }
  });

  // User profile update
  app.post("/api/users/profile", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { name, email, mobile, upiId } = req.body;
      const updated = await storage.updateUser(userId, { name, email, mobile, upiId });
      res.json(updated || {});
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(400).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/users/profile", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      res.json(user || {});
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch profile" });
    }
  });

  // PG Master endpoints - Multi-PG Support
  
  // Get all PGs for the owner
  app.get("/api/pgs", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const pgs = await storage.getAllPgsByOwnerId(userId);
      res.json(pgs);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch PGs" });
    }
  });

  // Get current/selected PG
  app.get("/api/pg", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Check if a PG is selected in session
      const selectedPgId = (req.session as any).selectedPgId;
      
      if (selectedPgId) {
        const pg = await storage.getPgById(selectedPgId);
        // Verify this PG belongs to the user
        if (pg && pg.ownerId === userId) {
          return res.json(pg);
        }
      }
      
      // Fall back to first PG
      const pg = await storage.getPgByOwnerId(userId);
      if (pg) {
        (req.session as any).selectedPgId = pg.id;
      }
      res.json(pg);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch PG details" });
    }
  });

  // Select a PG to work with
  app.post("/api/pg/select/:id", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const pgId = parseInt(req.params.id);
      const pg = await storage.getPgById(pgId);
      
      if (!pg || pg.ownerId !== userId) {
        return res.status(404).json({ error: "PG not found" });
      }
      
      (req.session as any).selectedPgId = pgId;
      
      // Explicitly save session to ensure persistence
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        res.json({ success: true, pg });
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to select PG" });
    }
  });

  // Get PG status (for pending approval banner)
  app.get("/api/pg/status", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Only owners can check PG status" });
      }

      const selectedPgId = req.session!.selectedPgId;
      let pg;
      
      if (selectedPgId) {
        pg = await storage.getPgById(selectedPgId);
      } else {
        pg = await storage.getPgByOwnerId(userId);
      }

      if (!pg) {
        return res.status(404).json({ error: "No PG found" });
      }

      res.json({
        id: pg.id,
        name: pg.name,
        status: pg.status,
        isActive: pg.isActive,
        rejectionReason: pg.rejectionReason,
      });
    } catch (error) {
      console.error("Get PG status error:", error);
      res.status(500).json({ error: "Failed to fetch PG status" });
    }
  });

  // Get a specific PG by ID
  app.get("/api/pg/:id", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const pgId = parseInt(req.params.id);
      const pg = await storage.getPgById(pgId);
      
      if (!pg || pg.ownerId !== userId) {
        return res.status(404).json({ error: "PG not found" });
      }
      
      res.json(pg);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch PG details" });
    }
  });

  // Create a new PG
  app.post("/api/pg", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const pg = await storage.createPgMaster({ ownerId: userId, ...req.body });
      // Auto-select the newly created PG
      (req.session as any).selectedPgId = pg.id;
      res.json(pg);
    } catch (error) {
      res.status(400).json({ error: "Failed to create PG" });
    }
  });

  // Update a specific PG
  app.put("/api/pg/:id", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const pgId = parseInt(req.params.id);
      const pg = await storage.getPgById(pgId);
      
      if (!pg || pg.ownerId !== userId) {
        return res.status(404).json({ error: "PG not found" });
      }
      
      const updated = await storage.updatePgMasterById(pgId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update PG" });
    }
  });

  // Delete a PG
  app.delete("/api/pg/:id", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const pgId = parseInt(req.params.id);
      const pg = await storage.getPgById(pgId);
      
      if (!pg || pg.ownerId !== userId) {
        return res.status(404).json({ error: "PG not found" });
      }
      
      // Get all PGs before deletion to know if we need to auto-select another
      const allPgs = await storage.getAllPgsByOwnerId(userId);
      
      // Don't allow deleting the last PG
      if (allPgs.length <= 1) {
        return res.status(400).json({ error: "Cannot delete your only PG. Create another PG first." });
      }
      
      await storage.deletePgMaster(pgId);
      
      let newActivePg = null;
      
      // If this was the selected PG, auto-select another one
      if ((req.session as any).selectedPgId === pgId) {
        // Find another PG to select
        newActivePg = allPgs.find(p => p.id !== pgId);
        if (newActivePg) {
          (req.session as any).selectedPgId = newActivePg.id;
        } else {
          delete (req.session as any).selectedPgId;
        }
      }
      
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
        }
        res.json({ success: true, newActivePg });
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete PG" });
    }
  });

  // TENANT ROUTES
  app.post("/api/tenants", requireApprovedPg, async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Require selectedPgId for tenant creation to ensure correct PG context
      const selectedPgId = req.session!.selectedPgId;
      if (!selectedPgId) {
        return res.status(400).json({ error: "Please select a PG first" });
      }
      
      const pg = await storage.getPgById(selectedPgId);
      if (!pg || pg.ownerId !== userId) {
        return res.status(400).json({ error: "Invalid PG selected" });
      }

      const body = createTenantSchema.parse(req.body);
      
      // Check if user already exists with this email
      let tenantUser = await storage.getUserByEmail(body.email);
      
      if (!tenantUser) {
        // Create new tenant user account with default password
        const defaultPassword = generateDefaultPassword();
        tenantUser = await storage.createUser({
          name: body.name,
          email: body.email,
          mobile: body.phone,
          userType: "tenant",
          password: defaultPassword,
          isVerified: true, // Email already provided by owner
          requiresPasswordReset: true, // Force password reset on first login
        });
        
        console.log(`Tenant user created with email: ${body.email}, default password: ${defaultPassword}`);
      }
      
      const tenant = await storage.createTenant({
        ownerId: userId,
        pgId: pg.id,
        userId: tenantUser.id,
        name: body.name,
        email: body.email,
        phone: body.phone,
        roomNumber: body.roomNumber,
        monthlyRent: body.monthlyRent.toString(),
        tenantImage: body.tenantImage,
        aadharCard: body.aadharCard,
      });

      // Save emergency contacts if provided (supports both old single contact and new array format)
      const emergencyContacts = body.emergencyContacts as Array<{name: string; phone: string; relationship: string}> | undefined;
      
      if (emergencyContacts && Array.isArray(emergencyContacts)) {
        // New array format
        for (const contact of emergencyContacts) {
          if (contact.name && contact.phone && contact.relationship) {
            await storage.createEmergencyContact({
              tenantId: tenant.id,
              name: contact.name,
              phone: contact.phone,
              relationship: contact.relationship,
            });
          }
        }
      } else if (body.emergencyContactName && body.emergencyContactPhone && body.relationship) {
        // Legacy single contact format (for backward compatibility)
        await storage.createEmergencyContact({
          tenantId: tenant.id,
          name: body.emergencyContactName,
          phone: body.emergencyContactPhone,
          relationship: body.relationship,
        });
      }

      res.json({ success: true, tenant });
    } catch (error) {
      console.error("Tenant creation error:", error);
      res.status(400).json({ error: "Failed to create tenant", details: (error as any).message });
    }
  });

  app.get("/api/tenants", requireApprovedPg, async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const selectedPgId = req.session!.selectedPgId;
      const tenants = await storage.getTenants(userId, selectedPgId);
      res.json(tenants);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch tenants" });
    }
  });

  app.get("/api/tenants/:id", requireApprovedPg, async (req, res) => {
    try {
      const ownerId = req.session!.userId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const tenant = await storage.getTenant(parseInt(req.params.id));
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Verify tenant belongs to this owner
      if (tenant.ownerId !== ownerId) {
        return res.status(403).json({ error: "Not authorized to view this tenant" });
      }

      res.json(tenant);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch tenant" });
    }
  });

  app.put("/api/tenants/:id", requireApprovedPg, async (req, res) => {
    try {
      const ownerId = req.session!.userId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const existingTenant = await storage.getTenant(parseInt(req.params.id));
      if (!existingTenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Verify tenant belongs to this owner
      if (existingTenant.ownerId !== ownerId) {
        return res.status(403).json({ error: "Not authorized to edit this tenant" });
      }

      const body = createTenantSchema.parse(req.body);
      const tenant = await storage.updateTenant(parseInt(req.params.id), {
        name: body.name,
        phone: body.phone,
        roomNumber: body.roomNumber,
        monthlyRent: body.monthlyRent.toString(),
        tenantImage: body.tenantImage,
        aadharCard: body.aadharCard,
      });
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Update emergency contact if provided
      if (body.emergencyContactName && body.emergencyContactPhone && body.relationship) {
        // Delete existing emergency contacts for this tenant
        await storage.deleteEmergencyContactsByTenant(parseInt(req.params.id));
        // Create new emergency contact
        await storage.createEmergencyContact({
          tenantId: parseInt(req.params.id),
          name: body.emergencyContactName,
          phone: body.emergencyContactPhone,
          relationship: body.relationship,
        });
      }

      res.json({ success: true, tenant });
    } catch (error) {
      console.error("Tenant update error:", error);
      res.status(400).json({ error: "Failed to update tenant", details: (error as any).message });
    }
  });

  app.delete("/api/tenants/:id", requireApprovedPg, async (req, res) => {
    try {
      const ownerId = req.session!.userId;
      if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const tenant = await storage.getTenant(parseInt(req.params.id));
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Verify tenant belongs to this owner
      if (tenant.ownerId !== ownerId) {
        return res.status(403).json({ error: "Not authorized to delete this tenant" });
      }

      // Delete tenant and associated emergency contacts
      await storage.deleteEmergencyContactsByTenant(parseInt(req.params.id));
      await storage.deleteTenant(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete tenant" });
    }
  });

  // EMERGENCY CONTACTS ROUTES
  app.get("/api/tenants/:tenantId/emergency-contacts", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const tenantId = parseInt(req.params.tenantId);
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      if (tenant.ownerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const contacts = await storage.getEmergencyContactsByTenant(tenantId);
      res.json(contacts);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch emergency contacts" });
    }
  });

  app.post("/api/tenants/:tenantId/emergency-contacts", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.tenantId);
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      if (tenant.ownerId !== req.session!.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const body = insertEmergencyContactSchema.parse({
        ...req.body,
        tenantId
      });

      const contact = await storage.createEmergencyContact(body);
      res.json({ success: true, contact });
    } catch (error) {
      console.error("Emergency contact creation error:", error);
      res.status(400).json({ error: "Failed to create emergency contact", details: (error as any).message });
    }
  });

  app.delete("/api/emergency-contacts/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      // In production, verify ownership via contact's tenant relationship
      await storage.deleteEmergencyContact(contactId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete emergency contact" });
    }
  });

  // PAYMENTS ROUTES
  app.get("/api/payments", requireApprovedPg, async (req, res) => {
    try {
      if (!req.session!.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const selectedPgId = req.session!.selectedPgId;
      const payments = await storage.getPayments(req.session!.userId, selectedPgId);
      res.json(payments);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch payments" });
    }
  });

  // Create a new payment (owner only)
  app.post("/api/payments", requireApprovedPg, async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Only owners can create payments" });
      }

      const selectedPgId = req.session!.selectedPgId;
      if (!selectedPgId) {
        return res.status(400).json({ error: "Please select a PG first" });
      }

      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        ownerId: userId,
        pgId: selectedPgId,
        status: "pending",
      });

      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      console.error("Create payment error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid payment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Generate automatic payments for all tenants in PG based on rent payment date
  app.post("/api/payments/auto-generate", requireApprovedPg, async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Only owners can generate payments" });
      }

      const selectedPgId = req.session!.selectedPgId;
      if (!selectedPgId) {
        return res.status(400).json({ error: "Please select a PG first" });
      }

      const payments = await storage.generateAutoPaymentsForPg(selectedPgId, userId);
      res.status(201).json({ 
        success: true, 
        message: `Generated ${payments.length} payment requests`,
        payments 
      });
    } catch (error) {
      console.error("Auto-generate payment error:", error);
      res.status(500).json({ error: "Failed to generate automatic payments" });
    }
  });

  // Update payment status (mark as paid with transaction ID)
  app.put("/api/payments/:id", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const paymentId = parseInt(req.params.id);
      
      // Get the payment before update to check status change and authorization
      const oldPaymentResult = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
      const oldPayment = oldPaymentResult[0];
      
      if (!oldPayment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Authorization check: verify user has permission to update this payment
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (user.userType === "tenant") {
        // Tenant can only update their own payments
        const tenant = await storage.getTenantByUserId(userId);
        if (!tenant || oldPayment.tenantId !== tenant.id) {
          return res.status(403).json({ error: "You can only update your own payments" });
        }
      } else if (user.userType === "owner") {
        // Owner can only update payments for their tenants
        if (oldPayment.ownerId !== userId) {
          return res.status(403).json({ error: "You can only update payments for your tenants" });
        }
      } else {
        return res.status(403).json({ error: "Access denied" });
      }

      const payment = await storage.updatePayment(paymentId, {
        ...req.body,
        paidAt: req.body.status === "paid" ? new Date() : undefined,
      });

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      // Create notification for owner when tenant marks payment as paid
      if (req.body.status === "paid" && oldPayment.status !== "paid") {
        const tenant = await storage.getTenant(payment.tenantId);
        if (tenant) {
          await storage.createNotification({
            userId: payment.ownerId,
            pgId: payment.pgId || null,
            title: "Payment Received",
            message: `${tenant.name} has submitted rent payment of ₹${payment.amount}. Transaction ID: ${req.body.transactionId || 'N/A'}`,
            type: "payment",
            isRead: false,
          });
        }
      }

      res.json(payment);
    } catch (error) {
      console.error("Update payment error:", error);
      res.status(500).json({ error: "Failed to update payment" });
    }
  });

  // Get owner's UPI ID (tenant-facing)
  app.get("/api/tenant/owner-upi", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get tenant record to find owner
      const tenant = await storage.getTenantByUserId(userId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant record not found" });
      }

      // Get owner details
      const owner = await storage.getUser(tenant.ownerId);
      if (!owner) {
        return res.status(404).json({ error: "Owner not found" });
      }

      res.json({ 
        upiId: owner.upiId || null,
        ownerName: owner.name,
        ownerMobile: owner.mobile
      });
    } catch (error) {
      console.error("Get owner UPI error:", error);
      res.status(500).json({ error: "Failed to fetch owner details" });
    }
  });

  // Get tenant's payment history
  app.get("/api/tenant/payments", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Access denied" });
      }

      const tenant = await storage.getTenantByUserId(userId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant record not found" });
      }

      const payments = await storage.getPaymentsByTenant(tenant.id);
      res.json(payments);
    } catch (error) {
      console.error("Get tenant payments error:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  // NOTIFICATIONS ROUTES
  app.get("/api/notifications", requireApprovedPg, async (req, res) => {
    try {
      if (!req.session!.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const selectedPgId = req.session!.selectedPgId;
      const notifications = await storage.getNotifications(req.session!.userId, selectedPgId);
      res.json(notifications);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch notifications" });
    }
  });

  // AVAILABLE TENANTS ROUTE
  app.get("/api/available-tenants", requireApprovedPg, async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const selectedPgId = req.session!.selectedPgId;
      const availableTenants = await storage.getAvailableTenants(userId, selectedPgId);
      res.json(availableTenants);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch available tenants" });
    }
  });

  // ACTIVE ROOMS ROUTE (for tenant add/edit screens - only rooms with available slots)
  app.get("/api/active-rooms", requireApprovedPg, async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const selectedPgId = req.session!.selectedPgId;
      const rooms = await storage.getRooms(userId, selectedPgId);
      // Return only rooms that have available slots (not fully occupied)
      const activeRooms = rooms
        .filter(room => {
          const occupiedSlots = (Array.isArray(room.tenantIds) && room.tenantIds.length) || 0;
          return occupiedSlots < room.sharing;
        })
        .map(room => ({
          id: room.id,
          roomNumber: room.roomNumber,
          monthlyRent: room.monthlyRent,
          status: room.status,
          sharing: room.sharing,
          availableSlots: room.sharing - ((Array.isArray(room.tenantIds) && room.tenantIds.length) || 0)
        }));
      res.json(activeRooms);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch rooms" });
    }
  });

  // ROOMS ROUTES
  app.post("/api/rooms", requireApprovedPg, async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Require selectedPgId for room creation to ensure correct PG context
      const selectedPgId = req.session!.selectedPgId;
      if (!selectedPgId) {
        return res.status(400).json({ error: "Please select a PG first" });
      }
      
      const pg = await storage.getPgById(selectedPgId);
      if (!pg || pg.ownerId !== userId) {
        return res.status(400).json({ error: "Invalid PG selected" });
      }

      const body = insertRoomSchema.parse(req.body);
      
      // Check if room number already exists for this PG (using pgId filter)
      const existingRoom = await storage.getRoomByNumber(userId, body.roomNumber, pg.id);
      if (existingRoom) {
        return res.status(400).json({ error: `Room number ${body.roomNumber} already exists in this PG` });
      }
      
      const room = await storage.createRoom({
        ...body,
        ownerId: userId,
        pgId: pg.id,
      });

      res.json({ success: true, room });
    } catch (error) {
      console.error("Room creation error:", error);
      res.status(400).json({ error: "Failed to create room", details: (error as any).message });
    }
  });

  app.get("/api/rooms", requireApprovedPg, async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const selectedPgId = req.session!.selectedPgId;
      const roomsWithTenants = await storage.getAllRoomsWithTenants(userId, selectedPgId);
      res.json(roomsWithTenants);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch rooms" });
    }
  });

  // Bulk upload rooms from CSV
  app.post("/api/rooms/bulk-upload", requireApprovedPg, upload.single('file'), async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Require selectedPgId for bulk upload to ensure correct PG context
      const selectedPgId = req.session!.selectedPgId;
      if (!selectedPgId) {
        return res.status(400).json({ error: "Please select a PG first" });
      }
      
      const pg = await storage.getPgById(selectedPgId);
      if (!pg || pg.ownerId !== userId) {
        return res.status(400).json({ error: "Invalid PG selected" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const dryRun = req.body.dryRun === 'true';

      // Parse CSV
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ''),
      });

      if (parseResult.errors.length > 0) {
        return res.status(400).json({ 
          error: "CSV parsing errors", 
          details: parseResult.errors.map(e => ({ row: e.row, message: e.message }))
        });
      }

      const results = {
        processed: 0,
        created: 0,
        failed: 0,
        errors: [] as { row: number; roomNumber: string; message: string }[],
        warnings: [] as { row: number; roomNumber: string; message: string }[],
      };

      const roomsToCreate: any[] = [];

      // Validate each row
      for (let i = 0; i < parseResult.data.length; i++) {
        const row = parseResult.data[i] as any;
        const rowNum = i + 2; // +2 because header is row 1 and arrays are 0-indexed
        results.processed++;

        try {
          // Validate and parse the row
          const validatedRow = bulkRoomRowSchema.parse({
            roomNumber: row.roomnumber || row.room_number || row['room number'] || '',
            floor: row.floor || '1',
            sharing: row.sharing || row.sharingcapacity || row['sharing capacity'] || '1',
            monthlyRent: row.monthlyrent || row.monthly_rent || row['monthly rent'] || row.rent || '0',
            status: row.status || '',
            hasAttachedBathroom: row.hasattachedbathroom || row.attached_bathroom || row['attached bathroom'] || 'false',
            hasAC: row.hasac || row.ac || row['has ac'] || 'false',
            amenities: row.amenities || '',
            tenantIdentifiers: row.tenantidentifiers || row.tenant_identifiers || row.tenants || '',
          });

          // Check for duplicate room number in this PG (using pgId filter)
          const existingRoom = await storage.getRoomByNumber(userId, validatedRow.roomNumber, pg.id);
          if (existingRoom) {
            results.failed++;
            results.errors.push({
              row: rowNum,
              roomNumber: validatedRow.roomNumber,
              message: `Room number ${validatedRow.roomNumber} already exists in this PG`
            });
            continue;
          }

          // Check if room already in our batch
          if (roomsToCreate.some(r => r.roomNumber === validatedRow.roomNumber)) {
            results.failed++;
            results.errors.push({
              row: rowNum,
              roomNumber: validatedRow.roomNumber,
              message: `Duplicate room number ${validatedRow.roomNumber} in upload file`
            });
            continue;
          }

          // Resolve tenant identifiers to tenant IDs
          const tenantIds: number[] = [];
          for (const identifier of validatedRow.tenantIdentifiers) {
            const tenant = await storage.getTenantByEmailOrPhone(userId, identifier);
            if (!tenant) {
              results.failed++;
              results.errors.push({
                row: rowNum,
                roomNumber: validatedRow.roomNumber,
                message: `Tenant not found with identifier: ${identifier}`
              });
              continue;
            }
            if (tenant.pgId !== pg.id) {
              results.warnings.push({
                row: rowNum,
                roomNumber: validatedRow.roomNumber,
                message: `Tenant ${identifier} belongs to a different PG, skipping tenant assignment`
              });
              continue;
            }
            tenantIds.push(tenant.id);
          }

          // Check if tenant count exceeds sharing capacity
          if (tenantIds.length > validatedRow.sharing) {
            results.failed++;
            results.errors.push({
              row: rowNum,
              roomNumber: validatedRow.roomNumber,
              message: `Tenant count (${tenantIds.length}) exceeds sharing capacity (${validatedRow.sharing})`
            });
            continue;
          }

          // Determine room status: use CSV-specified status or compute from occupancy
          let status = validatedRow.status;
          if (!status) {
            // Auto-compute status based on tenant count
            if (tenantIds.length === 0) {
              status = 'vacant';
            } else if (tenantIds.length >= validatedRow.sharing) {
              status = 'fully_occupied';
            } else {
              status = 'partially_occupied';
            }
          }

          roomsToCreate.push({
            ownerId: userId,
            pgId: pg.id,
            roomNumber: validatedRow.roomNumber,
            floor: validatedRow.floor,
            sharing: validatedRow.sharing,
            monthlyRent: validatedRow.monthlyRent.toString(),
            hasAttachedBathroom: validatedRow.hasAttachedBathroom,
            hasAC: validatedRow.hasAC,
            amenities: validatedRow.amenities,
            tenantIds: tenantIds,
            status: status,
          });

        } catch (validationError: any) {
          results.failed++;
          const roomNum = row.roomnumber || row.room_number || row['room number'] || 'Unknown';
          results.errors.push({
            row: rowNum,
            roomNumber: roomNum,
            message: validationError.errors?.[0]?.message || validationError.message || 'Validation failed'
          });
        }
      }

      // If not dry run, create the rooms
      if (!dryRun) {
        for (const roomData of roomsToCreate) {
          try {
            await storage.createRoom(roomData);
            results.created++;
          } catch (createError: any) {
            results.failed++;
            results.errors.push({
              row: 0,
              roomNumber: roomData.roomNumber,
              message: `Failed to create room: ${createError.message}`
            });
          }
        }
      } else {
        // In dry run mode, count potential successes
        results.created = roomsToCreate.length;
      }

      res.json({
        success: results.failed === 0,
        dryRun,
        summary: {
          total: results.processed,
          created: results.created,
          failed: results.failed,
        },
        errors: results.errors,
        warnings: results.warnings,
      });

    } catch (error: any) {
      console.error("Bulk upload error:", error);
      res.status(400).json({ error: "Bulk upload failed", details: error.message });
    }
  });

  // Download CSV template for bulk upload
  app.get("/api/rooms/bulk-upload-template", async (req, res) => {
    const template = `roomNumber,floor,sharing,monthlyRent,status,hasAttachedBathroom,hasAC,amenities,tenantIdentifiers
101,1,2,8000,vacant,true,false,WiFi;Water;Power,
102,1,3,10000,partially_occupied,false,true,WiFi;Power,tenant@email.com
103,2,1,6000,,true,true,WiFi;Water,`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=room_bulk_upload_template.csv');
    res.send(template);
  });

  app.post("/api/rooms/seed", async (req, res) => {
    try {
      const userId = (req.session && req.session.userId) || 1;
      await storage.seedInitialRooms(userId);
      res.json({ success: true, message: "Rooms and tenants seeded successfully" });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(400).json({ error: "Failed to seed rooms", details: (error as any).message });
    }
  });

  app.get("/api/rooms/:id", async (req, res) => {
    try {
      const room = await storage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch room" });
    }
  });

  app.put("/api/rooms/:id", requireApprovedPg, async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const body = insertRoomSchema.partial().parse(req.body);
      
      // Get current room to check ownership and get pgId
      const currentRoom = await storage.getRoom(roomId);
      if (!currentRoom) {
        return res.status(404).json({ error: "Room not found" });
      }
      if (currentRoom.ownerId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      // If updating room number, check for duplicates in same PG (excluding current room)
      if (body.roomNumber) {
        const existingRoom = await storage.getRoomByNumber(userId, body.roomNumber, currentRoom.pgId || undefined);
        if (existingRoom && existingRoom.id !== roomId) {
          return res.status(400).json({ error: `Room number ${body.roomNumber} already exists in this PG` });
        }
      }
      
      const room = await storage.updateRoom(roomId, body);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }
      res.json({ success: true, room });
    } catch (error) {
      console.error("Room update error:", error);
      res.status(400).json({ error: "Failed to update room", details: (error as any).message });
    }
  });

  app.delete("/api/rooms/:id", requireApprovedPg, async (req, res) => {
    try {
      await storage.deleteRoom(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete room" });
    }
  });

  // Bulk upload tenants from CSV
  app.post("/api/tenants/bulk-upload", requireApprovedPg, upload.single('file'), async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const selectedPgId = req.session!.selectedPgId;
      if (!selectedPgId) {
        return res.status(400).json({ error: "Please select a PG first" });
      }
      
      const pg = await storage.getPgById(selectedPgId);
      if (!pg || pg.ownerId !== userId) {
        return res.status(400).json({ error: "Invalid PG selected" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const dryRun = req.body.dryRun === 'true';

      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ''),
      });

      if (parseResult.errors.length > 0) {
        return res.status(400).json({ 
          error: "CSV parsing errors", 
          details: parseResult.errors.map(e => ({ row: e.row, message: e.message }))
        });
      }

      const results = {
        processed: 0,
        created: 0,
        failed: 0,
        errors: [] as { row: number; email: string; message: string }[],
        warnings: [] as { row: number; email: string; message: string }[],
      };

      const tenantsToCreate: any[] = [];

      for (let i = 0; i < parseResult.data.length; i++) {
        const row = parseResult.data[i] as any;
        const rowNum = i + 2;
        results.processed++;

        try {
          const email = (row.email || row['email address'] || '').trim();
          const name = (row.name || row['tenant name'] || '').trim();
          const phone = (row.phone || row['phone number'] || '').trim();
          const monthlyRent = (row.monthlyrent || row.monthly_rent || row['monthly rent'] || row.rent || '0').toString();
          const roomNumber = (row.roomnumber || row.room_number || row['room number'] || '').trim();

          if (!email || !name || !phone) {
            results.failed++;
            results.errors.push({
              row: rowNum,
              email: email || 'Unknown',
              message: 'Email, name, and phone are required'
            });
            continue;
          }

          const existingTenant = await storage.getTenantByEmail(email, userId);
          if (existingTenant) {
            results.failed++;
            results.errors.push({
              row: rowNum,
              email: email,
              message: `Tenant with email ${email} already exists`
            });
            continue;
          }

          if (tenantsToCreate.some(t => t.email === email)) {
            results.failed++;
            results.errors.push({
              row: rowNum,
              email: email,
              message: `Duplicate email ${email} in upload file`
            });
            continue;
          }

          let roomId = undefined;
          if (roomNumber) {
            const room = await storage.getRoomByNumber(userId, roomNumber, pg.id);
            if (room) {
              roomId = room.id;
            }
          }

          tenantsToCreate.push({
            ownerId: userId,
            pgId: pg.id,
            name: name,
            email: email,
            phone: phone,
            monthlyRent: monthlyRent,
            roomId: roomId,
            status: 'active'
          });
        } catch (validationError: any) {
          results.failed++;
          const email = row.email || row['email address'] || 'Unknown';
          results.errors.push({
            row: rowNum,
            email: email,
            message: validationError.message || 'Validation failed'
          });
        }
      }

      if (!dryRun) {
        for (const tenantData of tenantsToCreate) {
          try {
            await storage.createTenant(tenantData);
            results.created++;
          } catch (createError: any) {
            results.failed++;
            results.errors.push({
              row: 0,
              email: tenantData.email,
              message: createError.message || 'Failed to create tenant'
            });
          }
        }
      } else {
        results.created = tenantsToCreate.length;
      }

      res.json({
        success: results.failed === 0,
        dryRun: dryRun,
        summary: {
          total: results.processed,
          created: results.created,
          failed: results.failed,
        },
        errors: results.errors,
        warnings: results.warnings,
      });
    } catch (error) {
      console.error("Tenant bulk upload error:", error);
      res.status(400).json({ error: "Failed to process bulk upload", details: (error as any).message });
    }
  });

  app.get("/api/tenants/bulk-upload-template", async (req, res) => {
    const template = `name,email,phone,monthlyRent,roomNumber
John Doe,john@example.com,9876543210,8000,101
Jane Smith,jane@example.com,9876543211,8000,102
Bob Johnson,bob@example.com,9876543212,10000,103`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tenant_bulk_upload_template.csv');
    res.send(template);
  });

  // COMPLAINTS ROUTES
  // Get all complaints for owner (filtered by current PG)
  app.get("/api/complaints", requireApprovedPg, async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Access denied" });
      }

      const pgId = req.session.selectedPgId;
      const complaints = await storage.getComplaints(userId, pgId);

      res.json(complaints);
    } catch (error) {
      console.error("Get complaints error:", error);
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  // Get complaints for tenant
  app.get("/api/tenant/complaints", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get tenant record
      const tenant = await storage.getTenantByUserId(userId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant record not found" });
      }

      const complaints = await storage.getComplaintsByTenant(tenant.id);
      res.json(complaints);
    } catch (error) {
      console.error("Get tenant complaints error:", error);
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  // Create a new complaint
  app.post("/api/complaints", async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(403).json({ error: "Access denied" });
      }

      let complaintData;

      if (user.userType === "tenant") {
        // Tenant creating complaint
        const tenant = await storage.getTenantByUserId(userId);
        if (!tenant) {
          return res.status(404).json({ error: "Tenant record not found" });
        }

        complaintData = insertComplaintSchema.parse({
          ...req.body,
          tenantId: tenant.id,
          ownerId: tenant.ownerId,
          pgId: tenant.pgId,
          // Auto-populate roomId from tenant's assigned room if not provided
          roomId: req.body.roomId || tenant.roomId,
        });
      } else if (user.userType === "owner") {
        // Owner creating complaint on behalf of tenant
        const pgId = req.session.selectedPgId;
        if (!pgId) {
          return res.status(400).json({ error: "Please select a PG first" });
        }

        // If tenantId is provided, auto-populate roomId from that tenant if not provided
        let roomId = req.body.roomId;
        if (!roomId && req.body.tenantId) {
          const tenant = await storage.getTenant(req.body.tenantId);
          if (tenant) {
            roomId = tenant.roomId;
          }
        }

        complaintData = insertComplaintSchema.parse({
          ...req.body,
          ownerId: userId,
          pgId: pgId,
          roomId: roomId,
        });
      } else {
        return res.status(403).json({ error: "Access denied" });
      }

      const complaint = await storage.createComplaint(complaintData);
      res.status(201).json(complaint);
    } catch (error) {
      console.error("Create complaint error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid complaint data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create complaint" });
    }
  });

  // Update complaint (owner only)
  app.put("/api/complaints/:id", requireApprovedPg, async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Only owners can update complaints" });
      }

      const complaintId = parseInt(req.params.id);
      const complaint = await storage.getComplaint(complaintId);

      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }

      if (complaint.ownerId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // If status is being set to 'resolved', add resolvedAt timestamp
      const updates = { ...req.body };
      if (updates.status === 'resolved' && complaint.status !== 'resolved') {
        updates.resolvedAt = new Date();
      }

      const updatedComplaint = await storage.updateComplaint(complaintId, updates);
      res.json(updatedComplaint);
    } catch (error) {
      console.error("Update complaint error:", error);
      res.status(500).json({ error: "Failed to update complaint" });
    }
  });

  // Delete complaint (owner only)
  app.delete("/api/complaints/:id", requireApprovedPg, async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Only owners can delete complaints" });
      }

      const complaintId = parseInt(req.params.id);
      const complaint = await storage.getComplaint(complaintId);

      if (!complaint) {
        return res.status(404).json({ error: "Complaint not found" });
      }

      if (complaint.ownerId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteComplaint(complaintId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete complaint error:", error);
      res.status(500).json({ error: "Failed to delete complaint" });
    }
  });

  // ADMIN ROUTES

  // Admin Dashboard Stats
  app.get("/api/admin/stats", adminOnly, async (req, res) => {
    try {
      const allPgs = await storage.getAllPgs();
      const pendingPgs = await storage.getPendingPgs();
      const allTenants = await storage.getAllTenants();
      const allComplaints = await storage.getAllComplaints();
      const allSubscriptions = await storage.getPgSubscriptions();
      
      const activeSubscriptions = allSubscriptions.filter(s => s.status === "paid");
      const totalRevenue = allSubscriptions
        .filter(s => s.status === "paid")
        .reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);

      res.json({
        totalPgs: allPgs.length,
        pendingApprovals: pendingPgs.length,
        approvedPgs: allPgs.filter(pg => pg.status === "approved").length,
        rejectedPgs: allPgs.filter(pg => pg.status === "rejected").length,
        activePgs: allPgs.filter(pg => pg.isActive).length,
        totalTenants: allTenants.length,
        totalComplaints: allComplaints.length,
        openComplaints: allComplaints.filter(c => c.status === "open").length,
        activeSubscriptions: activeSubscriptions.length,
        totalRevenue: totalRevenue,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // Get all PGs (admin view)
  app.get("/api/admin/pgs", adminOnly, async (req, res) => {
    try {
      const allPgs = await storage.getAllPgs();
      res.json(allPgs);
    } catch (error) {
      console.error("Get all PGs error:", error);
      res.status(500).json({ error: "Failed to fetch PGs" });
    }
  });

  // Get pending PGs
  app.get("/api/admin/pgs/pending", adminOnly, async (req, res) => {
    try {
      const pendingPgs = await storage.getPendingPgs();
      res.json(pendingPgs);
    } catch (error) {
      console.error("Get pending PGs error:", error);
      res.status(500).json({ error: "Failed to fetch pending PGs" });
    }
  });

  // Approve PG
  app.post("/api/admin/pgs/:id/approve", adminOnly, async (req: any, res) => {
    try {
      const pgId = parseInt(req.params.id);
      const adminId = req.user.id;
      
      const pg = await storage.approvePg(pgId, adminId);
      if (!pg) {
        return res.status(404).json({ error: "PG not found" });
      }

      res.json(pg);
    } catch (error) {
      console.error("Approve PG error:", error);
      res.status(500).json({ error: "Failed to approve PG" });
    }
  });

  // Reject PG
  app.post("/api/admin/pgs/:id/reject", adminOnly, async (req: any, res) => {
    try {
      const pgId = parseInt(req.params.id);
      const adminId = req.user.id;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ error: "Rejection reason is required" });
      }

      const pg = await storage.rejectPg(pgId, adminId, reason);
      if (!pg) {
        return res.status(404).json({ error: "PG not found" });
      }

      res.json(pg);
    } catch (error) {
      console.error("Reject PG error:", error);
      res.status(500).json({ error: "Failed to reject PG" });
    }
  });

  // Deactivate PG
  app.post("/api/admin/pgs/:id/deactivate", adminOnly, async (req, res) => {
    try {
      const pgId = parseInt(req.params.id);
      const pg = await storage.deactivatePg(pgId);
      
      if (!pg) {
        return res.status(404).json({ error: "PG not found" });
      }

      res.json(pg);
    } catch (error) {
      console.error("Deactivate PG error:", error);
      res.status(500).json({ error: "Failed to deactivate PG" });
    }
  });

  // Activate PG
  app.post("/api/admin/pgs/:id/activate", adminOnly, async (req, res) => {
    try {
      const pgId = parseInt(req.params.id);
      const pg = await storage.activatePg(pgId);
      
      if (!pg) {
        return res.status(404).json({ error: "PG not found" });
      }

      res.json(pg);
    } catch (error) {
      console.error("Activate PG error:", error);
      res.status(500).json({ error: "Failed to activate PG" });
    }
  });

  // Get all complaints (admin view)
  app.get("/api/admin/complaints", adminOnly, async (req, res) => {
    try {
      const allComplaints = await storage.getAllComplaints();
      res.json(allComplaints);
    } catch (error) {
      console.error("Get all complaints error:", error);
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  // Get all tenants (admin view)
  app.get("/api/admin/tenants", adminOnly, async (req, res) => {
    try {
      const allTenants = await storage.getAllTenants();
      res.json(allTenants);
    } catch (error) {
      console.error("Get all tenants error:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });

  // Subscription Plans
  app.get("/api/admin/subscription-plans", adminOnly, async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Get subscription plans error:", error);
      res.status(500).json({ error: "Failed to fetch subscription plans" });
    }
  });

  app.post("/api/admin/subscription-plans", adminOnly, async (req, res) => {
    try {
      const planData = req.body;
      const plan = await storage.createSubscriptionPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Create subscription plan error:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  });

  app.put("/api/admin/subscription-plans/:id", adminOnly, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      const updates = req.body;
      const plan = await storage.updateSubscriptionPlan(planId, updates);
      
      if (!plan) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }

      res.json(plan);
    } catch (error) {
      console.error("Update subscription plan error:", error);
      res.status(500).json({ error: "Failed to update subscription plan" });
    }
  });

  app.delete("/api/admin/subscription-plans/:id", adminOnly, async (req, res) => {
    try {
      const planId = parseInt(req.params.id);
      await storage.deleteSubscriptionPlan(planId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete subscription plan error:", error);
      res.status(500).json({ error: "Failed to delete subscription plan" });
    }
  });

  // PG Subscriptions
  app.get("/api/admin/pg-subscriptions", adminOnly, async (req, res) => {
    try {
      const subscriptions = await storage.getPgSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Get PG subscriptions error:", error);
      res.status(500).json({ error: "Failed to fetch PG subscriptions" });
    }
  });

  app.post("/api/admin/pg-subscriptions", adminOnly, async (req, res) => {
    try {
      const subscriptionData = req.body;
      const subscription = await storage.createPgSubscription(subscriptionData);
      res.status(201).json(subscription);
    } catch (error) {
      console.error("Create PG subscription error:", error);
      res.status(500).json({ error: "Failed to create PG subscription" });
    }
  });

  app.put("/api/admin/pg-subscriptions/:id", adminOnly, async (req, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const updates = req.body;
      const subscription = await storage.updatePgSubscription(subscriptionId, updates);
      
      if (!subscription) {
        return res.status(404).json({ error: "PG subscription not found" });
      }

      res.json(subscription);
    } catch (error) {
      console.error("Update PG subscription error:", error);
      res.status(500).json({ error: "Failed to update PG subscription" });
    }
  });

  // TENANT ONBOARDING JOURNEY ENDPOINTS

  // 1. Tenant Dashboard Status (Check onboarding)
  app.get("/api/tenant/onboarding-status", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const pgId = await storage.checkTenantOnboardingStatus(userId);
      
      if (!pgId) {
        return res.json({ 
          isOnboarded: false, 
          pgId: null, 
          pgName: null 
        });
      }

      const pg = await storage.getPgById(pgId);
      return res.json({ 
        isOnboarded: true, 
        pgId: pgId, 
        pgName: pg?.pgName || null 
      });
    } catch (error) {
      console.error("Get onboarding status error:", error);
      res.status(500).json({ error: "Failed to get onboarding status" });
    }
  });

  // 2. PG Search Endpoints
  app.get("/api/tenant/pgs/search", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const filters = {
        searchQuery: req.query.searchQuery as string | undefined,
        latitude: req.query.latitude ? parseFloat(req.query.latitude as string) : undefined,
        longitude: req.query.longitude ? parseFloat(req.query.longitude as string) : undefined,
        maxDistance: req.query.maxDistance ? parseFloat(req.query.maxDistance as string) : 10,
        pgType: req.query.pgType as string | undefined,
        hasFood: req.query.hasFood === 'true' ? true : undefined,
        hasParking: req.query.hasParking === 'true' ? true : undefined,
        hasAC: req.query.hasAC === 'true' ? true : undefined,
        hasCCTV: req.query.hasCCTV === 'true' ? true : undefined,
        hasWifi: req.query.hasWifi === 'true' ? true : undefined,
        hasLaundry: req.query.hasLaundry === 'true' ? true : undefined,
        hasGym: req.query.hasGym === 'true' ? true : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const pgs = await storage.searchPgs(filters);
      res.json(pgs);
    } catch (error) {
      console.error("Search PGs error:", error);
      res.status(500).json({ error: "Failed to search PGs" });
    }
  });

  app.get("/api/tenant/pgs/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const pgId = parseInt(req.params.id);
      const pgWithRooms = await storage.getPgWithRooms(pgId);

      if (!pgWithRooms) {
        return res.status(404).json({ error: "PG not found" });
      }

      res.json(pgWithRooms);
    } catch (error) {
      console.error("Get PG details error:", error);
      res.status(500).json({ error: "Failed to get PG details" });
    }
  });

  // 3. Visit Request Endpoints (Tenant)
  app.post("/api/tenant/visit-requests", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const body = createVisitRequestSchema.parse(req.body);
      
      const pg = await storage.getPgById(body.pgId);
      if (!pg) {
        return res.status(404).json({ error: "PG not found" });
      }

      const visitRequest = await storage.createVisitRequest({
        pgId: body.pgId,
        ownerId: pg.ownerId,
        tenantUserId: userId,
        roomId: body.roomId || null,
        requestedDate: new Date(body.requestedDate),
        requestedTime: body.requestedTime,
        notes: body.notes || null,
        status: "pending",
      });

      res.status(201).json(visitRequest);
    } catch (error) {
      console.error("Create visit request error:", error);
      res.status(400).json({ error: "Failed to create visit request" });
    }
  });

  app.get("/api/tenant/visit-requests", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const visitRequests = await storage.getVisitRequestsByTenant(userId);
      res.json(visitRequests);
    } catch (error) {
      console.error("Get visit requests error:", error);
      res.status(500).json({ error: "Failed to get visit requests" });
    }
  });

  app.patch("/api/tenant/visit-requests/:id/accept-reschedule", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const visitRequestId = parseInt(req.params.id);
      const visitRequest = await storage.acceptReschedule(visitRequestId);

      if (!visitRequest) {
        return res.status(404).json({ error: "Visit request not found" });
      }

      res.json(visitRequest);
    } catch (error) {
      console.error("Accept reschedule error:", error);
      res.status(500).json({ error: "Failed to accept reschedule" });
    }
  });

  app.patch("/api/tenant/visit-requests/:id/complete", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const visitRequestId = parseInt(req.params.id);
      const visitRequest = await storage.completeVisitRequest(visitRequestId);

      if (!visitRequest) {
        return res.status(404).json({ error: "Visit request not found" });
      }

      res.json(visitRequest);
    } catch (error) {
      console.error("Complete visit request error:", error);
      res.status(500).json({ error: "Failed to complete visit request" });
    }
  });

  app.delete("/api/tenant/visit-requests/:id", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const visitRequestId = parseInt(req.params.id);
      const visitRequest = await storage.cancelVisitRequest(visitRequestId);

      if (!visitRequest) {
        return res.status(404).json({ error: "Visit request not found" });
      }

      res.json({ success: true, message: "Visit request cancelled" });
    } catch (error) {
      console.error("Cancel visit request error:", error);
      res.status(500).json({ error: "Failed to cancel visit request" });
    }
  });

  // 4. Visit Request Endpoints (Owner)
  app.get("/api/visit-requests", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Owner access required" });
      }

      const visitRequests = await storage.getVisitRequestsByOwner(userId);
      res.json(visitRequests);
    } catch (error) {
      console.error("Get visit requests error:", error);
      res.status(500).json({ error: "Failed to get visit requests" });
    }
  });

  app.post("/api/visit-requests/:id/approve", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Owner access required" });
      }

      const visitRequestId = parseInt(req.params.id);
      const visitRequest = await storage.approveVisitRequest(visitRequestId);

      if (!visitRequest) {
        return res.status(404).json({ error: "Visit request not found" });
      }

      res.json(visitRequest);
    } catch (error) {
      console.error("Approve visit request error:", error);
      res.status(500).json({ error: "Failed to approve visit request" });
    }
  });

  app.post("/api/visit-requests/:id/reschedule", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Owner access required" });
      }

      const body = rescheduleVisitSchema.parse(req.body);
      const visitRequestId = parseInt(req.params.id);
      
      const visitRequest = await storage.rescheduleVisitRequest(
        visitRequestId,
        new Date(body.newDate),
        body.newTime,
        "owner"
      );

      if (!visitRequest) {
        return res.status(404).json({ error: "Visit request not found" });
      }

      res.json(visitRequest);
    } catch (error) {
      console.error("Reschedule visit request error:", error);
      res.status(400).json({ error: "Failed to reschedule visit request" });
    }
  });

  // 5. Onboarding Request Endpoints (Tenant)
  app.post("/api/tenant/onboarding-requests", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const body = createOnboardingRequestSchema.parse(req.body);
      
      const pg = await storage.getPgById(body.pgId);
      if (!pg) {
        return res.status(404).json({ error: "PG not found" });
      }

      const onboardingRequest = await storage.createOnboardingRequest({
        pgId: body.pgId,
        ownerId: pg.ownerId,
        tenantUserId: userId,
        visitRequestId: body.visitRequestId || null,
        roomId: body.roomId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        monthlyRent: body.monthlyRent.toString(),
        tenantImage: body.tenantImage || null,
        aadharCard: body.aadharCard || null,
        emergencyContactName: body.emergencyContactName || null,
        emergencyContactPhone: body.emergencyContactPhone || null,
        emergencyContactRelationship: body.emergencyContactRelationship || null,
        status: "pending",
      });

      res.status(201).json(onboardingRequest);
    } catch (error) {
      console.error("Create onboarding request error:", error);
      res.status(400).json({ error: "Failed to create onboarding request" });
    }
  });

  app.get("/api/tenant/onboarding-requests/:pgId", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "tenant") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const pgId = parseInt(req.params.pgId);
      const onboardingRequest = await storage.getOnboardingRequestByTenant(userId, pgId);

      if (!onboardingRequest) {
        return res.status(404).json({ error: "Onboarding request not found" });
      }

      res.json(onboardingRequest);
    } catch (error) {
      console.error("Get onboarding request error:", error);
      res.status(500).json({ error: "Failed to get onboarding request" });
    }
  });

  // 6. Onboarding Request Endpoints (Owner)
  app.get("/api/onboarding-requests", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Owner access required" });
      }

      const onboardingRequests = await storage.getOnboardingRequestsByOwner(userId);
      res.json(onboardingRequests);
    } catch (error) {
      console.error("Get onboarding requests error:", error);
      res.status(500).json({ error: "Failed to get onboarding requests" });
    }
  });

  app.post("/api/onboarding-requests/:id/approve", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Owner access required" });
      }

      const onboardingRequestId = parseInt(req.params.id);
      const onboardingRequest = await storage.approveOnboardingRequest(onboardingRequestId);

      if (!onboardingRequest) {
        return res.status(404).json({ error: "Onboarding request not found" });
      }

      res.json(onboardingRequest);
    } catch (error) {
      console.error("Approve onboarding request error:", error);
      res.status(500).json({ error: "Failed to approve onboarding request" });
    }
  });

  app.post("/api/onboarding-requests/:id/reject", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "owner") {
        return res.status(403).json({ error: "Owner access required" });
      }

      const body = rejectOnboardingSchema.parse(req.body);
      const onboardingRequestId = parseInt(req.params.id);
      
      const onboardingRequest = await storage.rejectOnboardingRequest(onboardingRequestId, body.reason);

      if (!onboardingRequest) {
        return res.status(404).json({ error: "Onboarding request not found" });
      }

      res.json(onboardingRequest);
    } catch (error) {
      console.error("Reject onboarding request error:", error);
      res.status(400).json({ error: "Failed to reject onboarding request" });
    }
  });

  return httpServer;
}
