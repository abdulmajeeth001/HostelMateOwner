import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTenantSchema, insertPaymentSchema, insertNotificationSchema, insertRoomSchema } from "@shared/schema";
import { z } from "zod";

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

      // Save OTP to database
      await storage.createOtp({ email, code: otp, expiresAt });

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

  app.get("/api/auth/me", (req, res) => {
    if (!req.session!.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ userId: req.session!.userId });
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

  // PG Master endpoints
  app.get("/api/pg", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const pg = await storage.getPgByOwnerId(userId);
      res.json(pg);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch PG details" });
    }
  });

  app.post("/api/pg", async (req, res) => {
    try {
      const userId = req.session!.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const existing = await storage.getPgByOwnerId(userId);
      
      if (existing) {
        const updated = await storage.updatePgMaster(userId, req.body);
        res.json(updated || {});
      } else {
        const pg = await storage.createPgMaster({ ownerId: userId, ...req.body });
        res.json(pg || {});
      }
    } catch (error) {
      res.status(400).json({ error: "Failed to save PG details" });
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
      });

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
      const tenant = await storage.getTenant(parseInt(req.params.id));
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      res.json(tenant);
    } catch (error) {
      res.status(400).json({ error: "Failed to fetch tenant" });
    }
  });

  app.put("/api/tenants/:id", async (req, res) => {
    try {
      const body = createTenantSchema.parse(req.body);
      const tenant = await storage.updateTenant(parseInt(req.params.id), {
        name: body.name,
        phone: body.phone,
        roomNumber: body.roomNumber,
        monthlyRent: body.monthlyRent.toString(),
      });
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      res.json({ success: true, tenant });
    } catch (error) {
      console.error("Tenant update error:", error);
      res.status(400).json({ error: "Failed to update tenant", details: (error as any).message });
    }
  });

  app.delete("/api/tenants/:id", async (req, res) => {
    try {
      await storage.deleteTenant(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete tenant" });
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
