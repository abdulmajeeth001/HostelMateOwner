# WinkStay - PG Management System

## Overview

WinkStay is a comprehensive PG (Paying Guest) hostel management application for owners and tenants. It provides tools for managing rooms, tenants, payments, complaints, maintenance, and reporting. The system features a dual-interface design for efficient operations and transparent communication. It's a full-stack web application with a React frontend, Express.js backend, and PostgreSQL database managed with Drizzle ORM. The project aims to streamline hostel operations, enhance tenant experience, and provide owners with robust management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

**Important:** Always update this file (replit.md) whenever new functionality is added or existing functionality changes. This ensures accurate documentation for future sessions.

## System Architecture

### Technology Stack

**Frontend:** React 18 (TypeScript, Vite), Wouter, TanStack Query, Radix UI, Tailwind CSS, Framer Motion, Shadcn UI.
**Backend:** Express.js (TypeScript), session-based authentication, RESTful API, Bcrypt.
**Database:** PostgreSQL, Drizzle ORM, Neon serverless adapter.

### Application Structure

**Monorepo:**
- `/client`: React frontend (pages, components, hooks, utilities).
- `/server`: Express backend (routes, storage, DB setup, entry point).
- `/shared`: Shared code (Drizzle schema, Zod validation).
- `/script`: Build scripts.

### Authentication & Authorization

- **Session Management:** Cookie-based sessions (express-session) with secure, httpOnly cookies.
- **User Types:** Owner (full access), Tenant (limited access), Admin (defined).
- **Password Reset:** First-time login password reset, OTP verification for recovery, email-based resets.

### Database Schema

Core entities include Users, OTP Codes, PG Master, Rooms, Tenants, Emergency Contacts, Payments, Notifications, Visit Requests, Onboarding Requests, and Tenant History.

**Tenant History Table:** Tracks complete tenant lifecycle across different PG stays. Fields include:
- `tenantUserId`: Links to user account (preserved after tenant removal)
- `pgId`: PG where tenant stayed (nullable for edge cases)
- `roomId`, `roomNumber`: Room assignment details
- `moveInDate`, `moveOutDate`: Stay duration tracking
- `ownerFeedback`: Optional text feedback from owner
- `rating`: 1-5 star rating (optional)
- `behaviorTags`: Array of behavior descriptors (Quiet, Paid on Time, Clean, Cooperative, etc.)
- `recordedByOwnerId`: Owner who created the record
- `verificationStatus`: Validation state (verified/pending)

### Key Features

- **Multi-PG Support:** Owners can manage multiple properties with PG context switching.
- **Data Compression:** Large binary data (images, documents) are gzip-compressed and base64 encoded for storage.
- **Responsive Design:** Mobile-first approach with separate layouts (MobileLayout, DesktopLayout), `useIsMobile` hook, and PWA manifest. Navigation is simplified to use userType alone (reflects actual housing status: applicant vs tenant).
- **State Management:** React Query for server state caching, custom hooks for user/PG context.
- **Automated Payment Generation:** Monthly rent payment generation with duplicate prevention, in-app and email notifications. Configurable per PG with `rentPaymentDate`. Manual trigger available.
- **Electricity Billing System (Dec 2024):** Comprehensive room-level meter reading and billing with automatic charge calculation:
    - **Monthly Cycle Creation:** Owners create billing cycles for a specific month with unique constraint (pg_id, billing_month) preventing duplicates
    - **Room-Level Metering:** Three-step wizard flow: cycle details → room readings → confirmation
        - Support for individual room meters or shared meters with manual distribution
        - Automatic units calculation, rate-per-unit configuration, and room amount calculation
    - **Tenant Charge Distribution:** Automatic equal distribution of room charges among active tenants, creates pending electricity payments
    - **Duplicate Prevention:** Backend validation prevents multiple cycles for same month/PG; frontend clears existing room bills before re-saving to prevent duplication
    - **Back Button Safety:** When navigating back from summary to readings, existing room bills are deleted via API before allowing edits (prevents duplication on re-save)
    - **Payment Soft-Delete (Dec 2024):** Owners can delete pending payments with full audit trail:
        - **All Payment Types:** Delete functionality supports rent, electricity, deposits, and all other payment types (previously restricted to electricity only)
        - **Soft-Delete Approach:** Payments marked as status="deleted" instead of being removed from database, preserving complete audit history
        - **Audit Trail:** Tracks deletedBy (owner user ID) and deletedAt (timestamp) for compliance and reporting
        - **Pending-Only Restriction:** Only pending payments can be deleted; paid or rejected payments are protected
        - **Frontend Filtering:** Deleted payments automatically hidden from all payment lists (owner and tenant views)
        - **Data Integrity:** Complete financial history preserved for reconciliation, reporting, and compliance
    - **Error Handling:** Comprehensive validation at both frontend and backend; DELETE responses checked before proceeding with data recreation
    - **EB History Page (Dec 2024):** Dedicated history page for viewing confirmed electricity billing cycles:
        - **Confirmed Cycles Only:** Backend filters to show only confirmed billing cycles (status='confirmed'), excluding draft records from history view
        - **Draft Cleanup:** All draft billing cycles removed from database to eliminate duplicates and clutter
        - **Enhanced Search:** Date range filtering (from/to date) allows filtering cycles by billing period start date
        - **Clear Filters:** One-click reset of all search criteria (text search + date filters)
        - **Consistent UI:** "EB History" title used across desktop and mobile views with subtitle "View confirmed electricity billing cycles"
        - **Multiple Search Options:** Text search by billing month or invoice number combined with date range filters
        - **Responsive Design:** Full search functionality implemented in both desktop and mobile layouts
- **Onboarding System:** Two-stage process:
    1.  **Visit Request Flow:** Prospective tenants request visits, owners approve/reschedule/cancel.
    2.  **Onboarding Request Flow:** After visit, tenants submit a 4-step application (personal info, emergency contact, documents), owners review and approve/reject.
- **Notification System (Dec 2024):** Real-time dual notification system for owners with in-app and web push capabilities:
    - **Notification Bell UI:** Bell icon in owner layouts (desktop and mobile) with unread count badge and dropdown list
    - **In-App Notifications:** 30-second polling for new notifications, automatic toast pop-ups for new events
    - **Database Schema:** Notifications table tracks: userId, title, message, type (visit_request, onboarding_request, payment, complaint), referenceId, isRead, createdAt
    - **Push Subscriptions:** Table stores web push subscription data (endpoint, p256dh, auth keys) for owners who enable push notifications
    - **Automatic Triggers:** Notifications created for key events:
        - Visit request submitted → notifies owner
        - Onboarding request submitted → notifies owner
        - Payment submitted for approval → notifies owner
        - Complaint created by tenant → notifies owner
        - Payment approved → notifies tenant
        - Payment rejected → notifies tenant
    - **Security:** Ownership validation ensures users can only read/mark their own notifications
    - **Click-to-Navigate:** Clicking notifications navigates to relevant pages (/owner-visit-requests, /owner-onboarding-requests, /payments, /complaints)
    - **Service Worker:** Registered at /sw.js handles web push notifications with click handlers
    - **Push Delivery:** Infrastructure ready for web push (requires VAPID key configuration for actual delivery)
    - **Toast Deduplication:** Improved logic handles multiple new notifications, prevents duplicate toasts
- **Tenant Lifecycle Management:** Complete tracking of tenant housing status and history:
    - **UserType Lifecycle:** Reflects actual housing state - "applicant" (searching for housing) → "tenant" (has housing) → removed → "applicant" (with history preserved)
    - **Soft-Delete Approach:** Tenants marked as "vacated" (status="vacated") instead of hard deletion, preserving all payment history and tenant records
    - **Payment Validation:** Deletion blocked if tenant has pending/overdue payments - owner must settle all dues first
    - **Automatic History Creation:** When tenants are removed, a history record is automatically created capturing their stay duration, room assignment, and optional owner feedback
    - **TenantFeedbackDialog:** Rich feedback collection on tenant removal with 1-5 star rating, text feedback, and 12 behavior tags (Quiet, Paid on Time, Clean, Cooperative, Respectful, etc.)
    - **History Display:** Previous PG stays visible to owners during onboarding request review, including ratings, feedback, behavior tags, dates, and room details
    - **Batch Optimization:** Tenant history loading uses efficient batch queries (getBatchTenantHistory) to eliminate N+1 query problems
    - **User Preservation:** When tenants are removed, their user accounts remain intact with userType reverted to "applicant", allowing seamless re-application to different PGs
    - **Duplicate Prevention (Dec 2024):** Email-based duplicate checking prevents same email from being active tenant in multiple PGs simultaneously - returns clear error message with existing PG name (applies to both single and bulk tenant creation)
    - **Automated Onboarding Emails (Dec 2024):** Two distinct email templates sent automatically upon tenant creation (both single and bulk):
        - **New Users:** Welcome email with temporary password, login credentials, PG details, room info, and first-login password change requirement
        - **Existing Applicants:** Onboarding email with new PG assignment details (no password, since they already have an account)
    - **First-Login Password Reset:** New tenant users created with requiresPasswordReset flag, automatically redirected to /tenant-reset-password on first login
    - **Bulk Tenant Upload (Dec 2024):** CSV-based bulk tenant creation with comprehensive validation:
        - **Two-Phase Process:** Dry-run validation first, then actual creation with confirmation
        - **Global Duplicate Check:** Uses same getActiveTenantByEmail check as single tenant creation
        - **Room Validation:** Requires valid room number, verifies room belongs to correct PG/owner
        - **User Type Validation:** Rejects owner/admin accounts, only allows new users or applicants
        - **Defensive Creation:** Re-validates user status immediately before creation to handle concurrent changes
        - **Email Integration:** Sends same onboarding emails as single tenant creation (with/without passwords)
        - **Error Reporting:** Detailed row-level error messages, warnings for email failures
        - **Response Format:** Includes total, created, failed, and emailsSent counts
    - **Data Cleanup (Dec 2024):** One-time cleanup cancelled 2 legacy pending payments for vacated tenants, marking them as "rejected" with reason "Auto-cancelled: Tenant vacated before payment was settled"

### Build & Deployment

- **Development:** Vite dev server, HMR, Replit plugins.
- **Production:** Vite builds client, ESBuild bundles server, static file serving.
- **Environment Variables:** `DATABASE_URL`, `GMAIL_EMAIL`, `GMAIL_APP_PASSWORD`.

### API Design

RESTful endpoints for authentication, users, tenants, rooms, payments, and PG management.

### Error Handling

Zod for form validation, Sonner for toast notifications, error boundaries.

## External Dependencies

- **Database:** Neon Serverless PostgreSQL.
- **UI Component Libraries:** Radix UI, Lucide React, Shadcn UI.
- **Forms & Validation:** React Hook Form, Zod, @hookform/resolvers.
- **File Handling:** Pako (gzip), Base64 encoding.
- **Maps & Location:** OpenStreetMap Nominatim API.
- **Development Tools:** Replit Vite Plugins.
- **Utilities:** date-fns, nanoid, clsx, tailwind-merge.
- **Build Tools:** TypeScript, ESBuild, PostCSS, Autoprefixer.