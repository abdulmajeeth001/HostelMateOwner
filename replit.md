# WinkStay - PG Management System

## Overview
WinkStay is a comprehensive PG (Paying Guest) hostel management application designed for owners and tenants. It streamlines operations related to rooms, tenants, payments, complaints, maintenance, and reporting. The system features a dual-interface for owners and tenants, aiming to enhance tenant experience and provide owners with robust management capabilities. It is a full-stack web application utilizing React for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for the database.

## User Preferences
Preferred communication style: Simple, everyday language.
**Important:** Always update this file (replit.md) whenever new functionality is added or existing functionality changes. This ensures accurate documentation for future sessions.

## System Architecture

### Technology Stack
- **Frontend:** React 18 (TypeScript, Vite), Wouter, TanStack Query, Radix UI, Tailwind CSS, Framer Motion, Shadcn UI.
- **Backend:** Express.js (TypeScript), session-based authentication, RESTful API, Bcrypt.
- **Database:** PostgreSQL, Drizzle ORM, Neon serverless adapter.

### Application Structure
The project is organized as a monorepo:
- `/client`: React frontend.
- `/server`: Express backend.
- `/shared`: Contains shared code like Drizzle schema and Zod validation.
- `/script`: Build scripts.

### Authentication & Authorization
- **Session Management:** Secure, cookie-based sessions (express-session).
- **User Types:** Owner, Tenant, Admin.
- **Password Management:** First-time login password reset, OTP verification, email-based resets.

### Key Features
- **Multi-PG Support:** Owners can manage multiple properties with context switching.
- **Responsive Design:** Mobile-first approach with adaptive layouts and PWA manifest.
- **Automated Payment Generation:** Monthly rent payment generation with in-app/email notifications and configurable settings.
- **Electricity Billing System:** Comprehensive room-level meter reading and billing, including cycle creation, tenant charge distribution, and a history page for confirmed cycles. Supports soft-deletion of pending payments with audit trails.
- **Onboarding System:** A two-stage process involving visit requests and a 4-step tenant application workflow.
- **Notification System:** Real-time dual notification system for owners with in-app alerts and web push capabilities, including PG-specific filtering and click-to-navigate functionality.
- **Owner Dashboard:** Dynamic, PG-specific dashboard providing real-time statistics (total tenants, revenue, pending dues, occupancy rate) and a recent activity feed.
- **Tenant Lifecycle Management:** Tracks tenant housing status, preserves history through soft-deletion, automatically creates history records upon tenant removal, and provides detailed feedback mechanisms. Includes duplicate prevention for email addresses, automated onboarding emails, first-login password resets, and bulk tenant upload functionality via CSV with comprehensive validation.

### Data Handling
- **Data Compression:** Large binary data (images, documents) are gzip-compressed and base64 encoded.
- **Database Schema:** Core entities include Users, PG Master, Rooms, Tenants, Payments, Notifications, and Tenant History. The Tenant History table tracks full tenant lifecycle across stays, including owner feedback and behavior tags.

## External Dependencies
- **Database:** Neon Serverless PostgreSQL.
- **UI Components:** Radix UI, Lucide React, Shadcn UI.
- **Forms & Validation:** React Hook Form, Zod.
- **File Handling:** Pako (gzip), Base64 encoding.
- **Maps & Location:** OpenStreetMap Nominatim API.