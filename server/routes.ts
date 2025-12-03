import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTenantSchema, insertPaymentSchema, insertNotificationSchema, insertRoomSchema, insertEmergencyContactSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import Papa from "papaparse";

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
    }
    interface SessionData {
      userId?: number;
      registrationData?: any;
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
});

const otpVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
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
  // AUTH ROUTES
  app.post("/api/auth/register", async (req, res) => {
    try {
      const body = registrationSchema.parse(req.body);

      // Check if user exists
      const existingUser = await storage.getUserByEmail(body.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
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

      // TODO: Send OTP via Twilio and SendGrid
      console.log(`OTP for ${body.email}: ${otp}`);

      res.json({ 
        success: true, 
        message: "OTP sent to email and mobile",
        // FOR TESTING: Return OTP (remove in production)
        otp: process.env.NODE_ENV === "development" ? otp : undefined
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

      req.session!.userId = user.id;
      
      // Redirect based on user type
      let redirectUrl = "/dashboard";
      if (user.userType === "tenant") {
        redirectUrl = "/tenant-dashboard";
      }
      
      res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, userType: user.userType }, redirectUrl });
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

      console.log(`Password reset OTP for ${user.email}: ${otp}`);

      res.json({
        success: true,
        message: "OTP sent to email and mobile",
        otp: process.env.NODE_ENV === "development" ? otp : undefined
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

      // In production, send OTP via email and SMS
      console.log(`[FORGOT PASSWORD] OTP for ${email}: ${otp}`);

      res.json({ success: true, message: "OTP sent to your email and phone" });
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

      res.json({
        name: tenant.name,
        roomNumber: tenant.roomNumber,
        monthlyRent: tenant.monthlyRent,
      });
    } catch (error) {
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

      const room = await storage.getRoomByNumber(tenant.ownerId, tenant.roomNumber);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.json(room);
    } catch (error) {
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
      const { name, email, mobile } = req.body;
      const updated = await storage.updateUser(userId, { name, email, mobile });
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
  app.post("/api/tenants", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get owner's PG
      const pg = await storage.getPgByOwnerId(userId);
      if (!pg) {
        return res.status(400).json({ error: "Please create a PG first" });
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

  app.get("/api/tenants", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const tenants = await storage.getTenants(userId);
      res.json(tenants);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch tenants" });
    }
  });

  app.get("/api/tenants/:id", async (req, res) => {
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

  app.put("/api/tenants/:id", async (req, res) => {
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

  app.delete("/api/tenants/:id", async (req, res) => {
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
  app.get("/api/payments", async (req, res) => {
    try {
      if (!req.session!.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const payments = await storage.getPayments(req.session!.userId);
      res.json(payments);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch payments" });
    }
  });

  // NOTIFICATIONS ROUTES
  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session!.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const notifications = await storage.getNotifications(req.session!.userId);
      res.json(notifications);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch notifications" });
    }
  });

  // AVAILABLE TENANTS ROUTE
  app.get("/api/available-tenants", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const availableTenants = await storage.getAvailableTenants(userId);
      res.json(availableTenants);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch available tenants" });
    }
  });

  // ACTIVE ROOMS ROUTE (for tenant add/edit screens - only rooms with available slots)
  app.get("/api/active-rooms", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const rooms = await storage.getRooms(userId);
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
  app.post("/api/rooms", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get owner's PG
      const pg = await storage.getPgByOwnerId(userId);
      if (!pg) {
        return res.status(400).json({ error: "Please create a PG first" });
      }

      const body = insertRoomSchema.parse(req.body);
      
      // Check if room number already exists for this owner
      const existingRoom = await storage.getRoomByNumber(userId, body.roomNumber);
      if (existingRoom) {
        return res.status(400).json({ error: `Room number ${body.roomNumber} already exists` });
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

  app.get("/api/rooms", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const roomsWithTenants = await storage.getAllRoomsWithTenants(userId);
      res.json(roomsWithTenants);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch rooms" });
    }
  });

  // Bulk upload rooms from CSV
  app.post("/api/rooms/bulk-upload", upload.single('file'), async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get owner's current PG
      const selectedPgId = (req.session as any).selectedPgId;
      let pg;
      if (selectedPgId) {
        pg = await storage.getPgById(selectedPgId);
        if (!pg || pg.ownerId !== userId) {
          pg = await storage.getPgByOwnerId(userId);
        }
      } else {
        pg = await storage.getPgByOwnerId(userId);
      }
      
      if (!pg) {
        return res.status(400).json({ error: "Please create a PG first" });
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

          // Check for duplicate room number in this PG
          const existingRoom = await storage.getRoomByNumber(userId, validatedRow.roomNumber);
          if (existingRoom && existingRoom.pgId === pg.id) {
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

  app.put("/api/rooms/:id", async (req, res) => {
    try {
      const roomId = parseInt(req.params.id);
      const userId = (req.session && req.session.userId) || 1;
      const body = insertRoomSchema.partial().parse(req.body);
      
      // If updating room number, check for duplicates (excluding current room)
      if (body.roomNumber) {
        const existingRoom = await storage.getRoomByNumber(userId, body.roomNumber);
        if (existingRoom && existingRoom.id !== roomId) {
          return res.status(400).json({ error: `Room number ${body.roomNumber} already exists` });
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

  app.delete("/api/rooms/:id", async (req, res) => {
    try {
      await storage.deleteRoom(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete room" });
    }
  });

  return httpServer;
}
