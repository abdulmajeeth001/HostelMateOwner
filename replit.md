# WinkStay - PG Management System

## Overview

WinkStay is a comprehensive PG (Paying Guest) hostel management application for owners and tenants. It provides tools for managing rooms, tenants, payments, complaints, maintenance, and reporting. The system features a dual-interface design for efficient operations and transparent communication. It's a full-stack web application with a React frontend, Express.js backend, and PostgreSQL database managed with Drizzle ORM. The project aims to streamline hostel operations, enhance tenant experience, and provide owners with robust management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

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

Core entities include Users, OTP Codes, PG Master, Rooms, Tenants, Emergency Contacts, Payments, Notifications, Visit Requests, and Onboarding Requests.

### Key Features

- **Multi-PG Support:** Owners can manage multiple properties with PG context switching.
- **Data Compression:** Large binary data (images, documents) are gzip-compressed and base64 encoded for storage.
- **Responsive Design:** Mobile-first approach with separate layouts (MobileLayout, DesktopLayout), `useIsMobile` hook, and PWA manifest.
- **State Management:** React Query for server state caching, custom hooks for user/PG context.
- **Automated Payment Generation:** Monthly rent payment generation with duplicate prevention, in-app and email notifications. Configurable per PG with `rentPaymentDate`. Manual trigger available.
- **Onboarding System:** Two-stage process:
    1.  **Visit Request Flow:** Prospective tenants request visits, owners approve/reschedule/cancel.
    2.  **Onboarding Request Flow:** After visit, tenants submit a 4-step application (personal info, emergency contact, documents), owners review and approve/reject.

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