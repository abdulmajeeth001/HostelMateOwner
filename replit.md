# StayBuki - PG Management System

## Overview
StayBuki is a comprehensive PG (Paying Guest) hostel management application designed for owners and tenants. It streamlines operations related to rooms, tenants, payments, complaints, maintenance, and reporting. The system features a dual-interface for owners and tenants, aiming to enhance tenant experience and provide owners with robust management capabilities. It is a full-stack web application utilizing React for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for the database.

## User Preferences
Preferred communication style: Simple, everyday language.
**Important:** Always update this file (replit.md) whenever new functionality is added or existing functionality changes. This ensures accurate documentation for future sessions.

## System Architecture

### Technology Stack
- **Frontend:** React 18 (TypeScript, Vite), Wouter, TanStack Query, Radix UI, Tailwind CSS, Framer Motion, Shadcn UI.
- **Backend:** Express.js (TypeScript), session-based authentication, RESTful API, Bcrypt, UAParser.
- **Database:** PostgreSQL, Drizzle ORM, Neon serverless adapter.

### Application Structure
The project is organized as a monorepo:
- `/client`: React frontend.
- `/server`: Express backend.
- `/shared`: Contains shared code like Drizzle schema and Zod validation.
- `/script`: Build scripts.

### Authentication & Authorization
- **Session Management:** Secure, cookie-based sessions (express-session) with database-backed session tracking.
- **Multi-Device Support:** Users can login from multiple devices simultaneously with individual session management.
- **Remember Me:** Extended session duration (30 days) when enabled, otherwise 24 hours.
- **Device Management:** Users can view and manage all active login sessions via "Manage Devices" screen.
- **User Types:** Owner, Tenant, Admin.
- **Password Management:** First-time login password reset, OTP verification, email-based resets.

### Key Features
- **Multi-PG Support:** Owners can manage multiple properties with context switching and PG-specific data caching.
- **Responsive Design:** Mobile-first approach with adaptive layouts and PWA manifest.
- **Automated Payment Generation:** Monthly rent payment generation with in-app/email notifications and configurable settings.
- **Electricity Billing System:** Comprehensive room-level meter reading and billing, including cycle creation, tenant charge distribution, and a history page for confirmed cycles. Supports soft-deletion of pending payments with audit trails.
- **Onboarding System:** A two-stage process involving visit requests and a 4-step tenant application workflow.
- **Notification System:** Real-time dual notification system for owners with in-app alerts and web push capabilities, including PG-specific filtering and click-to-navigate functionality.
- **Owner Dashboard:** Dynamic, PG-specific dashboard providing real-time statistics (total tenants, revenue, pending dues, occupancy rate) and a recent activity feed. Automatically refreshes when switching between properties.
- **Tenant Lifecycle Management:** Tracks tenant housing status, preserves history through soft-deletion, automatically creates history records upon tenant removal, and provides detailed feedback mechanisms. Includes duplicate prevention for email addresses, automated onboarding emails, first-login password resets, and bulk tenant upload functionality via CSV with comprehensive validation.
- **Session Management:** Complete multi-device session tracking with device information (browser, OS, IP address), "Manage Devices" page for viewing all active sessions, ability to logout from individual devices or all other devices, automatic session cleanup, and session validation middleware.

### Data Handling
- **Data Compression:** Large binary data (images, documents) are gzip-compressed and base64 encoded.
- **Database Schema:** Core entities include Users, PG Master, Rooms, Tenants, Payments, Notifications, Sessions, and Tenant History. The Tenant History table tracks full tenant lifecycle across stays, including owner feedback and behavior tags. The Sessions table tracks all active user sessions with device information for security and device management.

## External Dependencies
- **Database:** Neon Serverless PostgreSQL.
- **UI Components:** Radix UI, Lucide React, Shadcn UI.
- **Forms & Validation:** React Hook Form, Zod.
- **File Handling:** Pako (gzip), Base64 encoding.
- **Maps & Location:** OpenStreetMap Nominatim API.
- **Device Detection:** UAParser.js for extracting browser, OS, and device type from user-agent strings.

## Recent Changes (December 21, 2025)

### Multi-Session Management System
- **Database:** Added `sessions` table to track active user sessions with sessionId, userId, deviceInfo (deviceName, deviceType, browser, OS), ipAddress, lastActiveAt, and expiresAt.
- **Backend:**
  - Created session storage methods for CRUD operations and session cleanup.
  - Updated login API to create session records with device info extracted from user-agent.
  - Implemented "Remember Me" functionality with extended cookie duration (30 days vs 24 hours).
  - Added session management APIs: GET /api/sessions, DELETE /api/sessions/:sessionId, POST /api/sessions/logout-all.
  - Added session validation middleware to check for invalidated sessions and destroy them.
  - Implemented hourly cleanup job to remove expired sessions.
  - Added session activity tracking middleware to update lastActiveAt on each request.
  - Updated logout endpoint to remove session from database and mark for invalidation.
- **Frontend:**
  - Created ManageDevices.tsx page showing all active sessions with device info, IP address, and last active time.
  - Added "This Device" badge to identify current session.
  - Implemented individual device logout and "Logout from All Other Devices" functionality.
  - Added route /manage-devices to application router.
  - Fixed dashboard query keys to include pgId for proper multi-PG data caching and automatic refresh when switching properties.

### Security Enhancements
- Session invalidation system ensures that logging out from a device actually revokes access (not just hiding the session in UI).
- Session validation middleware checks database for session existence on every request.
- Invalidated sessions are destroyed from express-session store to prevent unauthorized access.
